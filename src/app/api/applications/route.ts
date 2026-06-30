import { NextResponse } from "next/server";
import { createApplication, listApplicationsByFreelancer, listApplicationsForOrder } from "@/lib/orders";

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
    const freelancer_email = String(body.freelancer_email ?? "").trim().toLowerCase();
    const pitch            = body.pitch ? String(body.pitch).trim() : undefined;
    const bid_amount_usdc  = body.bid_amount_usdc !== undefined ? Number(body.bid_amount_usdc) : undefined;

    if (!order_id || !freelancer_email || !freelancer_email.includes("@")) {
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
    const email      = url.searchParams.get("email")?.trim().toLowerCase();

    if (orderIdRaw) {
      const orderId = Number(orderIdRaw);
      if (!orderId) return NextResponse.json({ error: "bad order_id" }, { status: 400 });
      const applications = await listApplicationsForOrder(orderId);
      return NextResponse.json({ applications });
    }

    if (email) {
      const applications = await listApplicationsByFreelancer(email);
      return NextResponse.json({ applications });
    }

    return NextResponse.json({ error: "specify order_id or email" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "applications_list_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
