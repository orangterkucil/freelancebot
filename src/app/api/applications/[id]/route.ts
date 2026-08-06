import { NextResponse } from "next/server";
import { getOrder, assertActorIsParty } from "@/lib/orders";
import {
  setApplicationStatus,
  setOrderFreelancer,
  setFreelancerWallet,
  getApplication,
  getLastKnownWallet,
} from "@/lib/orders";
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

    // The application being mutated MUST belong to the order we just authorized
    // against. Without this, authorization is checked on one object and the
    // write lands on another: pass your own order id with a stranger's
    // application id and you could reject or withdraw their application.
    const application = await getApplication(id);
    if (!application) return NextResponse.json({ error: "application not found" }, { status: 404 });
    if (application.order_id !== orderId) {
      logger.warn("api.applications.order_mismatch", { id, orderId, actual: application.order_id });
      return NextResponse.json({ error: "This application does not belong to that order" }, { status: 403 });
    }

    // Identity comes from the stored row, never from the request body.
    const applicantEmail = application.freelancer_email.toLowerCase();

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
      // Only the applicant may withdraw — compared against the row, since a
      // body-supplied email is just the caller's own claim.
      if (applicantEmail !== actorEmail) {
        return NextResponse.json(
          { error: "Forbidden — only the applicant can withdraw" },
          { status: 403 }
        );
      }
    }

    if (status === "accepted") {
      // Accepting rewrites the order's counterparty. Once the escrow is funded
      // that counterparty is baked into the on-chain order, so changing it here
      // would leave the app pointing at someone who cannot be paid — and would
      // lock the real freelancer out of the order mid-job.
      if (order.status !== "draft") {
        return NextResponse.json(
          { error: "This order is already funded — its freelancer is locked into the escrow terms." },
          { status: 400 }
        );
      }

      await setOrderFreelancer(orderId, applicantEmail);

      // Carry the payout address over so accepting is enough to fund. Without
      // this the client had to wait for the freelancer to come back and connect
      // a wallet — while the freelancer had no idea they'd been accepted.
      // Prefer the address given when applying; fall back to the one they used
      // on a previous job. setOrderFreelancer has already cleared any address
      // belonging to a previously accepted applicant.
      try {
        const fromApplication =
          application.wallet_address && /^0x[a-fA-F0-9]{40}$/.test(application.wallet_address)
            ? application.wallet_address
            : null;
        const wallet = fromApplication ?? (await getLastKnownWallet(applicantEmail));
        if (wallet) await setFreelancerWallet(orderId, wallet);
      } catch (e) {
        // Non-fatal: the freelancer can still connect manually on the order.
        logger.warn("api.applications.wallet_carryover_failed", { orderId, err: String(e) });
      }
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
