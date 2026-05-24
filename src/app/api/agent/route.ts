import { NextResponse } from "next/server";
import { chatTurn, type ChatMessage } from "@/lib/agent";
import { appendMessage, listMessages, getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/agent
 *
 * Body: { orderId: number, role: "client" | "freelancer", message: string }
 *
 * 1. Persists the user message to the messages table.
 * 2. Loads recent history + the order context.
 * 3. Asks the agent for a response.
 * 4. Persists the agent reply.
 * 5. Returns { reply, message: <persisted agent msg> }.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = Number(body.orderId);
    const role = body.role as "client" | "freelancer";
    const message = String(body.message ?? "").trim();

    if (!orderId || !message || (role !== "client" && role !== "freelancer")) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1) persist user msg
    await appendMessage(orderId, role, message);

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
          (order.deliverable_url ? `- Deliverable: ${order.deliverable_url}\n` : ""),
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
    return NextResponse.json(
      { error: "agent_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
