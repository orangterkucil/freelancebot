import { NextResponse } from "next/server";
import { reviewBrief } from "@/lib/agent";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/brief-review
 * Body: { brief, title?, amount_usdc?, deadline?, actor_email? }
 *
 * The agent reviews a job brief BEFORE the order exists, so a client finds out
 * their brief is unverifiable at posting time rather than after a freelancer has
 * already done the work.
 *
 * Advisory only: it creates nothing, changes nothing, and touches no funds.
 */
export async function POST(req: Request) {
  try {
    // Cost guard: this route calls the LLM.
    const rl = rateLimit(`brief:${clientIp(req)}`, 12, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many brief reviews. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();

    // Signed-in users only — this is an authoring aid, not a public LLM endpoint.
    const { email } = await getIdentity(req, body.actor_email);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    const brief = String(body.brief ?? "").slice(0, 4000);
    if (!brief.trim()) {
      return NextResponse.json({ error: "brief is required" }, { status: 400 });
    }

    const review = await reviewBrief({
      brief,
      title: body.title ? String(body.title).slice(0, 200) : null,
      amountUsdc: Number.isFinite(Number(body.amount_usdc)) ? Number(body.amount_usdc) : null,
      deadlineISO: body.deadline ? String(body.deadline) : null,
    });

    return NextResponse.json(review);
  } catch (err: any) {
    logger.error("api.brief_review.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "brief_review_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
