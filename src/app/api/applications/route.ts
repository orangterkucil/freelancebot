import { NextResponse } from "next/server";
import { createApplication, listApplicationsByFreelancer, listApplicationsForOrder } from "@/lib/orders";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/applications
 *   Body: { order_id, freelancer_email, pitch?, bid_amount_usdc? }
 *   Freelancer applies to a public job.
 *
 * GET /api/applications?order_id=<id>          List applications for a job (client view).
 * GET /api/applications?email=<freelancer>     List own applications (freelancer view).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order_id         = Number(body.order_id);
    const pitch            = body.pitch ? String(body.pitch).trim() : undefined;
    const bid_amount_usdc  = body.bid_amount_usdc !== undefined ? Number(body.bid_amount_usdc) : undefined;

    // The applicant is whoever is signed in — you can't apply as someone else.
    const { email: freelancer_email } = await getIdentity(req, body.freelancer_email);
    if (!freelancer_email) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    if (!order_id || !freelancer_email.includes("@")) {
      return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
    }

    const application = await createApplication({
      order_id,
      freelancer_email,
      pitch,
      bid_amount_usdc,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "application_create_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderIdRaw = url.searchParams.get("order_id");

    // Must be signed in to see application data.
    const { email: me } = await getIdentity(req, url.searchParams.get("email") ?? undefined);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    if (orderIdRaw) {
      const orderId = Number(orderIdRaw);
      if (!orderId) return NextResponse.json({ error: "bad order_id" }, { status: 400 });
      const applications = await listApplicationsForOrder(orderId);
      return NextResponse.json({ applications });
    }

    // Freelancer view: always scoped to your own applications, never someone else's.
    const applications = await listApplicationsByFreelancer(me);
    return NextResponse.json({ applications });
  } catch (err: any) {
    return NextResponse.json(
      { error: "applications_list_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
