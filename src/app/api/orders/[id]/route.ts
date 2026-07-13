import { NextResponse } from "next/server";
import {
  getOrder,
  listMessages,
  setOrderOnchainId,
  setOrderStatus,
  assertActorIsParty,
} from "@/lib/orders";
import { logger } from "@/lib/logger";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/orders/[id]?actor_email=...
 *   Returns the order. The message thread is only included if the caller is a party.
 *
 * PATCH /api/orders/[id]
 *   Body: { onchain_id?, status?, actor_email }
 *   Guard: actor must be a party (client OR freelancer).
 */

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number(params.id);
    if (!orderId) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

    const url = new URL(req.url);
    const { email: actorEmail } = await getIdentity(req, url.searchParams.get("actor_email") ?? undefined);
    const isParty =
      !!actorEmail &&
      (order.client_email.toLowerCase() === actorEmail.toLowerCase() ||
       order.freelancer_email.toLowerCase() === actorEmail.toLowerCase());

    // Public jobs are readable but their chat thread is private to parties.
    const messages = isParty ? await listMessages(orderId) : [];

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

    // ---- AUTH GUARD ----
    const { email: actorEmail } = await getIdentity(req, body.actor_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }
    const { role } = await assertActorIsParty(orderId, actorEmail);
    if (!role) {
      logger.warn("api.orders.patch.forbidden", { orderId, actorEmail });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
