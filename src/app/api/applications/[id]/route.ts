import { NextResponse } from "next/server";
import { getOrder, assertActorIsParty } from "@/lib/orders";
import { setApplicationStatus, setOrderFreelancer } from "@/lib/orders";
import { logger } from "@/lib/logger";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH /api/applications/[id]
 *   Body: { status: 'accepted' | 'rejected' | 'withdrawn',
 *           order_id, freelancer_email, actor_email }
 *
 * Guard: only the CLIENT of the order can accept/reject. The freelancer can
 * only withdraw their own application.
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

    const orderId         = Number(body.order_id);
    const freelancerEmail = String(body.freelancer_email ?? "").trim().toLowerCase();

    const { email: actorEmail } = await getIdentity(req, body.actor_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }
    if (!orderId) {
      return NextResponse.json({ error: "missing order_id" }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

    // ---- AUTH GUARD ----
    if (status === "accepted" || status === "rejected") {
      // Only client of the order can decide
      if (order.client_email.toLowerCase() !== actorEmail) {
        logger.warn("api.applications.decide.forbidden", { id, actorEmail, status });
        return NextResponse.json(
          { error: "Forbidden — only the order's client can accept/reject applications" },
          { status: 403 }
        );
      }
    } else if (status === "withdrawn") {
      // Only the applicant freelancer can withdraw their own app
      if (freelancerEmail !== actorEmail) {
        return NextResponse.json(
          { error: "Forbidden — only the applicant can withdraw" },
          { status: 403 }
        );
      }
    }

    if (status === "accepted") {
      if (!freelancerEmail) {
        return NextResponse.json({ error: "accept needs freelancer_email" }, { status: 400 });
      }
      await setOrderFreelancer(orderId, freelancerEmail);
    }

    await setApplicationStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error("api.applications.patch.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "application_patch_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
