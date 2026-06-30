import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { setApplicationStatus, setOrderFreelancer } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH /api/applications/[id]
 *   Body: { status: 'accepted' | 'rejected' | 'withdrawn', email?: string }
 *
 * If accepted: assign freelancer_email on the order and flip is_public=false.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const body = await req.json();
    const status = body.status;
    const allowed = ["accepted", "rejected", "withdrawn"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    // If accepting, also assign freelancer + close listing
    if (status === "accepted") {
      // We need the application to find its order + freelancer email
      // For brevity, expect order_id + freelancer_email in body
      const order_id         = Number(body.order_id);
      const freelancer_email = String(body.freelancer_email ?? "").trim().toLowerCase();
      if (!order_id || !freelancer_email) {
        return NextResponse.json({ error: "accept needs order_id + freelancer_email" }, { status: 400 });
      }
      const order = await getOrder(order_id);
      if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
      await setOrderFreelancer(order_id, freelancer_email);
    }

    await setApplicationStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "application_patch_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
