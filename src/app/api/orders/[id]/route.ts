import { NextResponse } from "next/server";
import {
  getOrder,
  listMessages,
  setOrderOnchainId,
  setOrderStatus,
  assertActorIsParty,
  enrichPublicOrder,
  updateOrderFields,
  setFreelancerWallet,
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

    // Public jobs are readable but the full record (emails, deliverable,
    // attachments, private links) and the chat thread are for parties only.
    const messages = isParty ? await listMessages(orderId) : [];
    // Non-parties get the scrubbed record + the poster's public label/rating so
    // the job detail can show "posted by <handle> ⭐" without leaking the email.
    const view = isParty ? order : await enrichPublicOrder(order);

    return NextResponse.json({ order: view, messages });
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

    // ---- EDIT (fix a mistake instead of creating a new order) ----
    // Only the client, only while the order is still a draft — once funded the
    // escrow terms are locked.
    if (body.edit && typeof body.edit === "object") {
      const current = await getOrder(orderId);
      if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
      if (current.client_email.toLowerCase() !== actorEmail.toLowerCase()) {
        return NextResponse.json({ error: "Only the client can edit this order" }, { status: 403 });
      }
      if (current.status !== "draft") {
        return NextResponse.json({ error: "This order is already funded — its terms are locked and can't be edited." }, { status: 400 });
      }
      const e = body.edit;
      if (typeof e.amount_usdc === "number" && (!Number.isFinite(e.amount_usdc) || e.amount_usdc < 0)) {
        return NextResponse.json({ error: "invalid amount" }, { status: 400 });
      }
      if (e.deadline && new Date(e.deadline).getTime() <= Date.now()) {
        return NextResponse.json({ error: "Deadline must be a future date." }, { status: 400 });
      }
      await updateOrderFields(orderId, {
        title:       e.title,
        brief:       e.brief,
        amount_usdc: e.amount_usdc,
        deadline:    e.deadline,
        field:       e.field,
        is_public:   typeof e.is_public === "boolean" ? e.is_public : undefined,
      });
      const updated = await getOrder(orderId);
      return NextResponse.json({ order: updated });
    }

    // ---- Freelancer sets their on-chain payout wallet ----
    if (typeof body.freelancer_wallet === "string" && body.freelancer_wallet) {
      const wallet = body.freelancer_wallet.trim();
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        return NextResponse.json({ error: "invalid wallet address" }, { status: 400 });
      }
      const current = await getOrder(orderId);
      if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
      if (current.freelancer_email.toLowerCase() !== actorEmail.toLowerCase()) {
        return NextResponse.json({ error: "Only the freelancer can set their payout wallet" }, { status: 403 });
      }
      await setFreelancerWallet(orderId, wallet);
      const updated = await getOrder(orderId);
      return NextResponse.json({ order: updated });
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
