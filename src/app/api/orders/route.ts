import { NextResponse } from "next/server";
import { createOrder, listOrdersForEmail } from "@/lib/orders";
import { getIdentity } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

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
    // A caller may only list THEIR OWN orders. We ignore any email query param
    // for authorization and use the verified session identity instead — passing
    // someone else's email no longer leaks their orders.
    const { email } = await getIdentity(req, url.searchParams.get("email") ?? undefined);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
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
    // Anti-abuse: cap order creation per IP so a bot can't flood the marketplace
    // with junk listings. (Per-account cap is applied below, once we know who.)
    const ipRl = rateLimit(`orders:create:ip:${clientIp(req)}`, 10, 60_000);
    if (!ipRl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many new orders. Slow down." },
        { status: 429, headers: { "Retry-After": String(ipRl.retryAfter) } }
      );
    }

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
    // You can't hire yourself on a DIRECT order (same email as both parties
    // breaks the role guards → a confusing "Forbidden"). Public marketplace
    // posts legitimately set freelancer_email = client_email as a placeholder
    // until an applicant is accepted, so this check only applies when NOT public.
    if (!is_public && client_email === freelancer_email) {
      return NextResponse.json(
        { error: "Client and freelancer must be different people — you can't hire yourself." },
        { status: 400 }
      );
    }

    // The creator must be signed in and must be one of the two parties — you
    // can't post an order that names other people as both sides.
    const { email: actorEmail } = await getIdentity(req, client_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }
    if (actorEmail !== client_email && actorEmail !== freelancer_email) {
      return NextResponse.json(
        { error: "Forbidden — you must be the client or freelancer on the order you create" },
        { status: 403 }
      );
    }

    // Per-account cap: even a signed-in account can't drip-spam listings.
    const acctRl = rateLimit(`orders:create:acct:${actorEmail}`, 12, 60_000);
    if (!acctRl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "You're creating orders too quickly. Slow down." },
        { status: 429, headers: { "Retry-After": String(acctRl.retryAfter) } }
      );
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
