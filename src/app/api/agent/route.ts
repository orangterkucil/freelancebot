import { NextResponse } from "next/server";
import { chatTurn, type ChatMessage } from "@/lib/agent";
import { appendMessage, listMessages, assertActorIsParty } from "@/lib/orders";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/agent
 * Body: { orderId, role: 'client'|'freelancer', message, actor_email }
 *
 * Guard: actor_email must match the order's client_email or freelancer_email.
 * The `role` field is what the user CLAIMS to be; the server verifies via actor_email.
 */
export async function POST(req: Request) {
  try {
    // Cost guard: this route calls the Groq LLM. Cap per-IP to stop bill abuse.
    const rl = rateLimit(`agent:${clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many messages. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const orderId    = Number(body.orderId);
    const claimedRole = body.role as "client" | "freelancer";
    const message    = String(body.message ?? "").trim();

    // Identity from the verified session (falls back to body email only in demo).
    const { email: actorEmail } = await getIdentity(req, body.actor_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    if (!orderId || !message || (claimedRole !== "client" && claimedRole !== "freelancer")) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ---- AUTH GUARD ----
    const { role: actualRole, order } = await assertActorIsParty(orderId, actorEmail);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!actualRole) {
      logger.warn("api.agent.forbidden", { orderId, actorEmail });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (actualRole !== claimedRole) {
      logger.warn("api.agent.role_mismatch", { orderId, actorEmail, claimedRole, actualRole });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1) persist user msg
    await appendMessage(orderId, actualRole, message);

    // 2) build history (last 20 messages) + order context
    const all = await listMessages(orderId);
    const recent = all.slice(-20);
    const history: ChatMessage[] = [
      {
        role: "system",
        content:
          `Order #${orderId} context:\n` +
          `- Client:     ${order.client_email}\n` +
          `- Freelancer: ${order.freelancer_email}\n` +
          `- Brief:      ${order.brief}\n` +
          `- Amount:     ${order.amount_usdc} USDC\n` +
          `- Deadline:   ${order.deadline ?? "none"}\n` +
          `- Status:     ${order.status}\n` +
          // Escrow facts — this is a payment agent, so the state of the money is
          // part of its working context, not an afterthought.
          `- Escrow on Arc: ${order.onchain_id != null ? `funded, on-chain order #${order.onchain_id}` : "not funded on-chain yet"}\n` +
          `- Payout wallet: ${order.freelancer_wallet ?? "not connected yet"}\n` +
          (order.deliverable_url ? `- Deliverable: ${order.deliverable_url}\n` : "") +
          (order.agent_notes ? `- Your last verification report:\n${order.agent_notes.split("\n---\n").pop()}\n` : ""),
      },
      ...recent.map((m) => ({
        role: (m.role === "agent" ? "assistant" : "user") as ChatMessage["role"],
        content: `[${m.role}] ${m.content}`,
      })),
    ];

    const reply = await chatTurn(history, message);

    // 3) persist agent reply
    const persisted = await appendMessage(orderId, "agent", reply);

    return NextResponse.json({ reply, message: persisted });
  } catch (err: any) {
    logger.error("api.agent.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "agent_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
