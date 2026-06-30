import { NextResponse } from "next/server";
import { verifyDeliverable } from "@/lib/agent";
import {
  appendAgentNotes,
  appendMessage,
  assertActorIsParty,
  setOrderDeliverable,
} from "@/lib/orders";
import { logger } from "@/lib/logger";

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
    const body = await req.json();
    const orderId        = Number(body.orderId);
    const deliverableUrl = String(body.deliverableUrl ?? "").trim();
    const actorEmail     = String(body.actor_email ?? "").trim();

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

    return NextResponse.json(verdict);
  } catch (err: any) {
    logger.error("api.verify.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "verify_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
