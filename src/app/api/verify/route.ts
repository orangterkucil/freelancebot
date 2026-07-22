import { NextResponse } from "next/server";
import { verifyDeliverable } from "@/lib/agent";
import {
  appendAgentNotes,
  appendMessage,
  assertActorIsParty,
  setOrderDeliverable,
  setOrderStatus,
} from "@/lib/orders";
import { getEscrowWithAgent } from "@/lib/contracts";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/verify
 * Body: { orderId, deliverableUrl, actor_email }
 *
 * Guard: actor must be the FREELANCER of the order.
 * (Only the freelancer can submit a deliverable.)
 */
export async function POST(req: Request) {
  try {
    // Cost guard: this route calls the Groq LLM. Cap per-IP to stop bill abuse.
    const rl = rateLimit(`verify:${clientIp(req)}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many verification requests. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const orderId        = Number(body.orderId);
    const deliverableUrl = String(body.deliverableUrl ?? "").trim();

    // Identity from the verified session (falls back to body email only in demo).
    const { email: actorEmail } = await getIdentity(req, body.actor_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    if (!orderId || !deliverableUrl) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ---- AUTH GUARD ----
    const { role, order } = await assertActorIsParty(orderId, actorEmail);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (role !== "freelancer") {
      logger.warn("api.verify.forbidden", { orderId, actorEmail, role });
      return NextResponse.json({ error: "Forbidden — only the freelancer can submit a deliverable" }, { status: 403 });
    }

    // 1) persist deliverable
    await setOrderDeliverable(orderId, deliverableUrl);

    // 2) verify
    const verdict = await verifyDeliverable({
      orderId,
      brief: order.brief,
      deliverableUrl,
      deadlineISO: order.deadline,
    });

    // 3) log
    const summary =
      `Verdict: ${verdict.verified ? "READY TO RELEASE" : "HOLD"}\n` +
      `Confidence: ${verdict.confidence}\n` +
      `URL reachable: ${verdict.checks.urlReachable}\n` +
      `Deadline met:  ${verdict.checks.deadlineMet}\n` +
      `Brief alignment: ${verdict.checks.briefAlignment}\n` +
      `Reasoning: ${verdict.reasoning}`;

    await appendAgentNotes(orderId, summary);
    await appendMessage(orderId, "agent", summary);

    // ---- AUTONOMOUS RELEASE (opt-in, OFF by default) ----
    // Money safety: autonomous release gives the agent "excessive agency" over
    // funds, and verification only sees the deliverable URL (not its contents),
    // so a reachable-but-junk deliverable could pass. Keep it OFF unless the
    // operator explicitly enables it (AGENT_AUTO_RELEASE=1) — otherwise release
    // stays a human decision (the client clicks "Approve & release").
    let autoReleased = false;
    if (verdict.verified && process.env.AGENT_AUTO_RELEASE === "1") {
      try {
        const escrow = getEscrowWithAgent();
        if (escrow && order.onchain_id != null) {
          const o: any = await escrow.getOrder(order.onchain_id);
          if (Number(o.status) === 2 /* Delivered */) {
            const tx = await escrow.approveAndRelease(order.onchain_id);
            await tx.wait();
          }
        }
        await setOrderStatus(orderId, "released");
        autoReleased = true;
        await appendMessage(orderId, "agent", "✅ Deliverable verified — payment released to the freelancer automatically. No manual approval needed.");
      } catch (err: any) {
        // Leave the order as 'delivered' so the client can release manually.
        logger.error("api.verify.autorelease_failed", { orderId, err: err?.message ?? String(err) });
      }
    }

    return NextResponse.json({ ...verdict, autoReleased });
  } catch (err: any) {
    logger.error("api.verify.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "verify_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
