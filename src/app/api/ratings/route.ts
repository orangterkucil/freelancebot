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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const body = await req.json();
    const order_id    = Number(body.order_id);
    const ratee_email = String(body.ratee_email ?? "").trim().toLowerCase();
    const stars       = Number(body.stars);
    const comment     = body.comment ? String(body.comment) : null;

    const { email: actor_email } = await getIdentity(req, body.actor_email);
    if (!actor_email) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
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

    const rating = await createRating({
      order_id,
      rater_email: actor_email,
      ratee_email,
      rater_role:  role,
      stars,
      comment,
    });
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
      const ratings = await listRatingsForOrder(orderId);
      return NextResponse.json({ ratings });
    }
    if (email && summary) {
      const s = await getRatingSummary(email);
      return NextResponse.json(s);
    }
    if (email) {
      const ratings = await listRatingsForRatee(email);
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
