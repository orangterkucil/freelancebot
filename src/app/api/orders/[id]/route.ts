import { NextResponse } from "next/server";
import { getOrder, listMessages, setOrderOnchainId, setOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/orders/[id]
 *   Returns the order plus its message thread.
 *
 * PATCH /api/orders/[id]
 *   Body: { onchain_id?: number, status?: OrderStatus }
 *   Used by the client frontend after the on-chain fund / release call succeeds,
 *   to keep the off-chain mirror in sync.
 */

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number(params.id);
    if (!orderId) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

    const messages = await listMessages(orderId);
    return NextResponse.json({ order, messages });
  } catch (err: any) {
    return NextResponse.json(
      { error: "get_order_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number(params.id);
    if (!orderId) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const body = await req.json();

    if (typeof body.onchain_id === "number") {
      await setOrderOnchainId(orderId, body.onchain_id);
    }

    if (typeof body.status === "string") {
      const allowed = ["draft", "funded", "delivered", "released", "refunded", "disputed"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      await setOrderStatus(orderId, body.status);
    }

    const updated = await getOrder(orderId);
    return NextResponse.json({ order: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: "patch_order_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
