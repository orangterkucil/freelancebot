import { NextResponse } from "next/server";
import { verifyDeliverable } from "@/lib/agent";
import {
  appendAgentNotes,
  appendMessage,
  getOrder,
  setOrderDeliverable,
} from "@/lib/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/verify
 *
 * Body: { orderId: number, deliverableUrl: string }
 *
 * 1. Persists the deliverable URL on the order (status -> "delivered").
 * 2. Runs the agent's verification (URL reachability + LLM brief alignment).
 * 3. Logs the verdict as an agent message + appends to agent_notes.
 * 4. Returns the verdict.
 *
 * The actual on-chain release happens from the frontend (week 5) once the client
 * (or agent wallet) chooses to act on this verdict.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = Number(body.orderId);
    const deliverableUrl = String(body.deliverableUrl ?? "").trim();

    if (!orderId || !deliverableUrl) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
