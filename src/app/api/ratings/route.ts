import { NextResponse } from "next/server";
import {
  assertActorIsParty,
  createRating,
  getRatingSummary,
  listRatingsForOrder,
  listRatingsForRatee,
} from "@/lib/orders";
import { logger } from "@/lib/logger";
import { getIdentity } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Strip PII from a rating before it goes out over a PUBLIC (unauthenticated) GET.
 * Ratings are shown as "Client → Freelancer · ⭐ · comment" — the raw rater/ratee
 * emails are never needed client-side, and returning them let anyone enumerate
 * the user graph via /api/ratings?order_id / ?email. Keep only non-identifying
 * fields.
 */
function publicRating(r: any) {
  return {
    id: r.id,
    order_id: r.order_id,
    rater_role: r.rater_role,
    stars: r.stars,
    comment: r.comment,
    created_at: r.created_at,
  };
}

/**
 * POST /api/ratings
 *   Body: { order_id, ratee_email, stars (1..5), comment?, actor_email }
 *   Guard: actor must be a party to the order; order status must be 'released'.
 *
 * GET /api/ratings?order_id=N      → list ratings for an order
 * GET /api/ratings?email=foo&summary=1 → { email, count, average }
 * GET /api/ratings?email=foo       → list ratings received by a user
 */

export async function POST(req: Request) {
  try {
    // Anti-abuse: blunt bot floods before doing any work (per IP).
    const ipRl = rateLimit(`ratings:ip:${clientIp(req)}`, 15, 60_000);
    if (!ipRl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many rating requests. Slow down." },
        { status: 429, headers: { "Retry-After": String(ipRl.retryAfter) } }
      );
    }

    const body = await req.json();
    const order_id    = Number(body.order_id);
    const ratee_email = String(body.ratee_email ?? "").trim().toLowerCase();
    const stars       = Number(body.stars);
    const comment     = body.comment ? String(body.comment) : null;

    const { email: actor_email } = await getIdentity(req, body.actor_email);
    if (!actor_email) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }
    // Per-account throttle (a signed-in bot can't spam-rate across many orders).
    const acctRl = rateLimit(`ratings:acct:${actor_email}`, 10, 60_000);
    if (!acctRl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many ratings from this account. Slow down." },
        { status: 429, headers: { "Retry-After": String(acctRl.retryAfter) } }
      );
    }
    if (!order_id || !ratee_email || !Number.isFinite(stars)) {
      return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
    }
    if (stars < 1 || stars > 5) {
      return NextResponse.json({ error: "stars must be 1..5" }, { status: 400 });
    }

    const { role, order } = await assertActorIsParty(order_id, actor_email);
    if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
    if (!role)  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== "released") {
      return NextResponse.json({ error: "ratings allowed only after release" }, { status: 400 });
    }

    // ratee must be the counterparty
    const counterparty = role === "client" ? order.freelancer_email : order.client_email;
    if (ratee_email !== counterparty.toLowerCase()) {
      return NextResponse.json({ error: "ratee must be the counterparty" }, { status: 400 });
    }

    // Anti-abuse: ONE rating per rater per order. The UI hides the form after
    // rating, but the API must enforce it too — otherwise a script could POST
    // repeatedly and inflate/spam a counterparty's score.
    const existing = await listRatingsForOrder(order_id);
    if (existing.some((r) => r.rater_email.toLowerCase() === actor_email.toLowerCase())) {
      return NextResponse.json({ error: "You have already rated this order." }, { status: 409 });
    }

    let rating;
    try {
      rating = await createRating({
        order_id,
        rater_email: actor_email,
        ratee_email,
        rater_role:  role,
        stars,
        comment,
      });
    } catch (e: any) {
      // DB unique index uq_ratings_unique is the hard guarantee (survives the
      // race the pre-check above can't). Turn its violation into a clean 409.
      if (e?.code === "23505") {
        return NextResponse.json({ error: "You have already rated this order." }, { status: 409 });
      }
      throw e;
    }
    return NextResponse.json({ rating }, { status: 201 });
  } catch (err: any) {
    logger.error("api.ratings.post.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "rating_create_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderIdRaw = url.searchParams.get("order_id");
    const email      = url.searchParams.get("email")?.trim().toLowerCase();
    const summary    = url.searchParams.get("summary");

    if (orderIdRaw) {
      const orderId = Number(orderIdRaw);
      if (!orderId) return NextResponse.json({ error: "bad order_id" }, { status: 400 });
      const ratings = (await listRatingsForOrder(orderId)).map(publicRating);
      return NextResponse.json({ ratings });
    }
    if (email && summary) {
      const s = await getRatingSummary(email);
      return NextResponse.json(s);
    }
    if (email) {
      const ratings = (await listRatingsForRatee(email)).map(publicRating);
      return NextResponse.json({ ratings });
    }
    return NextResponse.json({ error: "specify order_id or email" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "ratings_list_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
