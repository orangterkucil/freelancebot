import { NextResponse } from "next/server";
import { rankApplicants } from "@/lib/agent";
import { getOrder, listApplicationsForOrder, getRatingSummary } from "@/lib/orders";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/applications/rank
 * Body: { order_id, actor_email? }
 *
 * The agent reads every applicant's pitch against the brief, factors in their
 * rating history and counter-bid, and recommends one. Advisory only — the client
 * still accepts manually, and no funds are touched.
 *
 * Guard: only the order's client may run this (pitches are private to them).
 */
export async function POST(req: Request) {
  try {
    const rl = rateLimit(`rank:${clientIp(req)}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many ranking requests. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const orderId = Number(body.order_id);
    if (!orderId) return NextResponse.json({ error: "bad order_id" }, { status: 400 });

    const { email: actorEmail } = await getIdentity(req, body.actor_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
    if (order.client_email.toLowerCase() !== actorEmail.toLowerCase()) {
      logger.warn("api.rank.forbidden", { orderId, actorEmail });
      return NextResponse.json(
        { error: "Forbidden — only the client can rank applicants" },
        { status: 403 }
      );
    }

    const apps = (await listApplicationsForOrder(orderId)).filter((a) => a.status === "pending");
    if (apps.length === 0) {
      return NextResponse.json({ recommendedId: null, reasoning: "", notes: {} });
    }

    // Attach each applicant's reputation so the agent can weigh track record.
    const applicants = await Promise.all(
      apps.map(async (a) => {
        let ratingAverage = 0;
        let ratingCount = 0;
        try {
          const s = await getRatingSummary(a.freelancer_email);
          ratingAverage = s.average;
          ratingCount = s.count;
        } catch { /* reputation is best-effort */ }
        return {
          id: a.id,
          pitch: a.pitch,
          bidUsdc: a.bid_amount_usdc ?? null,
          ratingAverage,
          ratingCount,
        };
      })
    );

    const ranking = await rankApplicants({
      brief: order.brief,
      budgetUsdc: order.amount_usdc,
      applicants,
    });

    return NextResponse.json(ranking);
  } catch (err: any) {
    logger.error("api.rank.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "rank_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
