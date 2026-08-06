import { NextResponse } from "next/server";
import { verifyDeliverable } from "@/lib/agent";
import {
  appendAgentNotes,
  appendMessage,
  assertActorIsParty,
  setOrderDeliverable,
  setOrderStatus,
} from "@/lib/orders";
import { getEscrowWithAgent } from "@/lib/contracts";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/verify
 * Body: { orderId, deliverableUrl, actor_email }
 *
 * Guard: actor must be the FREELANCER of the order.
 * (Only the freelancer can submit a deliverable.)
 */
export async function POST(req: Request) {
  try {
    // Cost guard: this route calls the Groq LLM. Cap per-IP to stop bill abuse.
    const rl = rateLimit(`verify:${clientIp(req)}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", detail: "Too many verification requests. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const orderId        = Number(body.orderId);
    const deliverableUrl = String(body.deliverableUrl ?? "").trim();

    // Optional uploaded deliverable files (from the freelancer's FileDropzone).
    // Sanitize hard: cap the count, keep only known fields, require http(s) URLs.
    const deliverableFiles = (Array.isArray(body.deliverableFiles) ? body.deliverableFiles : [])
      .slice(0, 6)
      .map((f: any) => ({
        filename:     String(f?.filename ?? "file").slice(0, 200),
        url:          String(f?.url ?? ""),
        size_bytes:   Number(f?.size_bytes) || 0,
        content_type: String(f?.content_type ?? "application/octet-stream").slice(0, 100),
        uploaded_by:  String(f?.uploaded_by ?? "").slice(0, 200),
        created_at:   new Date().toISOString(),
      }))
      .filter((f: any) => /^https?:\/\//i.test(f.url));

    // Identity from the verified session (falls back to body email only in demo).
    const { email: actorEmail } = await getIdentity(req, body.actor_email);
    if (!actorEmail) {
      return NextResponse.json({ error: "Unauthorized — sign in required" }, { status: 401 });
    }

    if (!orderId || !deliverableUrl) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ---- AUTH GUARD ----
    const { role, order } = await assertActorIsParty(orderId, actorEmail);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (role !== "freelancer") {
      logger.warn("api.verify.forbidden", { orderId, actorEmail, role });
      return NextResponse.json({ error: "Forbidden — only the freelancer can submit a deliverable" }, { status: 403 });
    }

    // 1) persist deliverable (URL + any uploaded files)
    await setOrderDeliverable(orderId, deliverableUrl, deliverableFiles);

    // 2) verify
    const verdict = await verifyDeliverable({
      orderId,
      brief: order.brief,
      deliverableUrl,
      deadlineISO: order.deadline,
    });

    // 3) log
    // Written as the agent reporting its own work, not as a raw dump — this is
    // the moment both parties actually see the agent do something.
    const tick = (ok: boolean) => (ok ? "✔" : "✘");
    const inspected = verdict.checks.contentsInspected === true;
    const summary =
      `Deliverable received. Here's what I checked:\n\n` +
      `${tick(order.onchain_id != null)} Escrow funded on Arc${order.onchain_id != null ? ` (order #${order.onchain_id})` : ""}\n` +
      `${tick(!!order.freelancer_wallet)} Payout wallet on file${order.freelancer_wallet ? ` (${order.freelancer_wallet.slice(0, 6)}…${order.freelancer_wallet.slice(-4)})` : ""}\n` +
      `${tick(true)} Amount held: ${order.amount_usdc} USDC\n` +
      `${tick(verdict.checks.urlReachable)} Deliverable is reachable\n` +
      `${tick(verdict.checks.deadlineMet)} Submitted before the deadline\n` +
      `${tick(verdict.checks.briefAlignment === "matches")} Matches the brief — ${verdict.checks.briefAlignment}\n` +
      `${inspected ? "✔ I opened the file and looked at it" : "• I could only check the link, not the file contents"}\n\n` +
      (verdict.observed ? `What I see: ${verdict.observed}\n\n` : "") +
      `Verdict: ${verdict.verified ? "READY TO RELEASE" : "HOLD"} (${verdict.confidence} confidence)\n` +
      (verdict.verified
        ? `Recommendation: the client can release the payment.`
        : `Recommendation: the client should review this before releasing.`);

    await appendAgentNotes(orderId, summary);
    await appendMessage(orderId, "agent", summary);

    // ---- AUTONOMOUS RELEASE (opt-in, OFF by default) ----
    // Money safety: autonomous release gives the agent "excessive agency" over
    // funds, and verification only sees the deliverable URL (not its contents),
    // so a reachable-but-junk deliverable could pass. Keep it OFF unless the
    // operator explicitly enables it (AGENT_AUTO_RELEASE=1) — otherwise release
    // stays a human decision (the client clicks "Approve & release").
    let autoReleased = false;
    if (verdict.verified && process.env.AGENT_AUTO_RELEASE === "1") {
      try {
        const escrow = getEscrowWithAgent();
        const isOnchain = !!escrow && order.onchain_id != null;
        if (isOnchain) {
          // Real escrow: only mark released if the on-chain release ACTUALLY
          // executed. If the contract isn't in Delivered state (e.g. the
          // on-chain submitDelivery never landed), move no money and leave the
          // order 'delivered' for the client to handle — never claim a release
          // that didn't happen.
          const o: any = await escrow!.getOrder(order.onchain_id);
          if (Number(o.status) === 2 /* Delivered */) {
            const tx = await escrow!.approveAndRelease(order.onchain_id);
            await tx.wait();
            await setOrderStatus(orderId, "released");
            autoReleased = true;
          } else {
            logger.warn("api.verify.autorelease_skipped_wrong_state", { orderId, onchainStatus: Number(o.status) });
          }
        } else {
          // No on-chain escrow configured (demo mode) — settle off-chain.
          await setOrderStatus(orderId, "released");
          autoReleased = true;
        }
        if (autoReleased) {
          await appendMessage(orderId, "agent", "✅ Deliverable verified — payment released to the freelancer automatically. No manual approval needed.");
        }
      } catch (err: any) {
        // Leave the order as 'delivered' so the client can release manually.
        logger.error("api.verify.autorelease_failed", { orderId, err: err?.message ?? String(err) });
      }
    }

    return NextResponse.json({ ...verdict, autoReleased });
  } catch (err: any) {
    logger.error("api.verify.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { error: "verify_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
