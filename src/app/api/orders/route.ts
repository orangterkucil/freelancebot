import { NextResponse } from "next/server";
import { createOrder, listOrdersForEmail } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/orders?email=<email>
 *   Returns all orders where the given email is either the client OR the freelancer.
 *
 * POST /api/orders
 *   Body: { client_email, freelancer_email, brief, amount_usdc, deadline?, field?, title?, is_public?, attachments?, client_links? }
 *   Creates an order in "draft" status.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.trim();
    if (!email) {
      return NextResponse.json({ error: "email query param required" }, { status: 400 });
    }
    const orders = await listOrdersForEmail(email);
    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "list_orders_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client_email     = String(body.client_email ?? "").trim().toLowerCase();
    const freelancer_email = String(body.freelancer_email ?? "").trim().toLowerCase();
    const brief            = String(body.brief ?? "").trim();
    const title            = body.title ? String(body.title).trim() : null;
    const field            = body.field ? String(body.field).trim() : "other";
    const is_public        = Boolean(body.is_public);
    const attachments      = Array.isArray(body.attachments) ? body.attachments : [];
    const client_links     = typeof body.client_links === "object" && body.client_links ? body.client_links : {};
    const amount_usdc      = Number(body.amount_usdc);
    const deadline         = body.deadline ? String(body.deadline) : null;

    // v0.11.0: allow $0 orders (microtasks / pro-bono). Only reject negative + invalid.
    if (!client_email || !freelancer_email || !brief || !Number.isFinite(amount_usdc) || amount_usdc < 0) {
      return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
    }

    const order = await createOrder({
      client_email,
      freelancer_email,
      brief,
      title,
      field: field as any,
      is_public,
      attachments,
      client_links,
      amount_usdc,
      deadline,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "create_order_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
