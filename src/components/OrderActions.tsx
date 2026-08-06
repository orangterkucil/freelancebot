"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRightCircle, Coins, ExternalLink, ShieldAlert, RotateCcw, Wallet } from "lucide-react";
import type { Order, Attachment } from "@/lib/orders";
import { patchOrder, verifyDeliverable, setFreelancerWallet, unassignFreelancer } from "@/lib/api";
import { FileDropzone } from "./FileDropzone";
import {
  connectWallet,
  getEscrowWithSigner,
  getEscrowReadonly,
  getUsdcWithSigner,
  toUsdcUnits,
  ESCROW_ADDRESS,
  txUrl,
  USE_MEMO,
  sendWithMemo,
} from "@/lib/contracts";

const STATUS_NAMES = ["none", "funded", "delivered", "released", "refunded"];
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

/** Does this URL point at an image we can preview inline? */
function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(url);
}

/**
 * Does this order actually exist on the escrow contract? Orders funded in
 * demo/simulated mode were never created on-chain, so calling release/refund on
 * them reverts. We read the order back: a missing one has a zero client and
 * status None(0). Read-only, no wallet prompt.
 */
/**
 * On-chain order status: 0 none/absent, 1 Funded, 2 Delivered, 3 Released,
 * 4 Refunded, and -1 = READ FAILED (network/RPC error).
 *
 * The -1 case is critical: a transient read failure must NOT be mistaken for
 * "order absent" (0). Callers use 0 to mean "no on-chain escrow → settle the
 * demo order off-chain"; if a read error also mapped to 0, a flaky RPC at
 * release/refund time would silently mark the DB released/refunded WITHOUT
 * moving any USDC on-chain. So we return a distinct -1 and callers refuse to
 * settle on it.
 */
async function onChainStatus(onchainId: number): Promise<number> {
  try {
    const o: any = await getEscrowReadonly().getOrder(onchainId);
    const client = String(o.client ?? o[0] ?? "").toLowerCase();
    if (!client || client === ZERO_ADDR) return 0; // confirmed absent
    return Number(o.status ?? o[7] ?? 0);
  } catch {
    return -1; // read failed — do NOT treat as absent
  }
}

/**
 * Turn an ethers error into a message a human can act on. With the custom-error
 * ABI now loaded, on-chain reverts decode to their real reason (e.reason /
 * e.revert.name) instead of "unknown custom error".
 */
function friendlyChainError(e: any): string {
  if (e?.code === "ACTION_REJECTED" || /user rejected|denied|4001/i.test(String(e?.message))) {
    return "You rejected the transaction in your wallet.";
  }
  const name: string | undefined = e?.revert?.name ?? e?.reason;
  switch (name) {
    case "WrongStatus": {
      const actual = Number(e?.revert?.args?.[1] ?? e?.revert?.args?.actual ?? -1);
      if (actual === 0)
        return "This order was never funded on-chain (likely funded in demo/simulated mode), so there's nothing to refund on the contract.";
      if (actual === 2) return "Work was already delivered — refund only applies to a funded, undelivered order.";
      if (actual === 3) return "This order was already released to the freelancer.";
      if (actual === 4) return "This order was already refunded.";
      return `Order is in the wrong on-chain state (${STATUS_NAMES[actual] ?? actual}) for this action.`;
    }
    case "TooEarlyForRefund":
      return "Too early: the contract's deadline + 7-day grace period hasn't passed yet (its on-chain clock can differ from what the app shows).";
    case "DeadlineInPast":
      return "The order's deadline is in the past. Edit the order and set a future deadline before funding.";
    case "NotAuthorized":
      return "Your connected wallet isn't a party to this order on-chain.";
    case "InvalidAmount":
    case "InvalidAddress":
      return `Contract rejected the input (${name}).`;
    default:
      return e?.shortMessage ?? e?.reason ?? e?.message ?? "Transaction failed";
  }
}

export function OrderActions({
  order,
  role,
  onChanged,
}: {
  order: Order;
  role: "client" | "freelancer";
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<null | {
    verified: boolean;
    confidence: string;
    reasoning: string;
  }>(null);
  const [deliverable, setDeliverable] = useState(order.deliverable_url ?? "");
  const [deliverableFiles, setDeliverableFiles] = useState<Attachment[]>([]);
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const hasOnchain = !!ESCROW_ADDRESS;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e: any) {
      setError(friendlyChainError(e));
    } finally {
      setBusy(false);
    }
  };

  const fundOnChain = async () => {
    // Guard: the contract requires deadline strictly in the future (else it
    // reverts DeadlineInPast). Fail fast with a clear message instead of a
    // gas-wasting on-chain revert / "unknown custom error".
    const nowSec = Math.floor(Date.now() / 1000);
    const deadlineSec = order.deadline
      ? Math.floor(new Date(order.deadline).getTime() / 1000)
      : nowSec + 86400 * 7;
    if (deadlineSec <= nowSec) {
      throw new Error("This order's deadline is in the past — set a future deadline before funding.");
    }
    // The escrow pays out to the freelancer's wallet baked in here. Require the
    // real freelancer address — funding to the client's own wallet (the old bug)
    // meant the freelancer could never be paid.
    if (!order.freelancer_wallet) {
      throw new Error("The freelancer hasn't connected their payout wallet yet — ask them to connect it before you fund.");
    }

    const { signer } = await connectWallet();
    const amount = toUsdcUnits(order.amount_usdc);
    const usdc = getUsdcWithSigner(signer);
    const escrow = getEscrowWithSigner(signer);

    const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
    await approveTx.wait();

    const args = [order.freelancer_wallet, amount, order.brief, deadlineSec];
    const receipt = USE_MEMO
      ? await sendWithMemo(signer, ESCROW_ADDRESS, escrow.interface, "createAndFund", args, `FB-${order.id}`, `fund;order=${order.id}`)
      : await (await escrow.createAndFund(...args)).wait();
    setLastTxHash(receipt.hash);

    let onchainId: number | null = null;
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = escrow.interface.parseLog(log);
        if (parsed?.name === "OrderFunded") {
          onchainId = Number(parsed.args.orderId);
          break;
        }
      } catch {}
    }

    await patchOrder(order.id, {
      onchain_id: onchainId ?? order.id,
      status: "funded",
    });
  };

  const fundSimulated = async () => {
    await patchOrder(order.id, { onchain_id: order.id, status: "funded" });
  };

  const releaseOnChain = async () => {
    const { signer } = await connectWallet();
    const escrow = getEscrowWithSigner(signer);
    const onchainId = order.onchain_id ?? order.id;
    const receipt = USE_MEMO
      ? await sendWithMemo(signer, ESCROW_ADDRESS, escrow.interface, "approveAndRelease", [onchainId], `FB-${order.id}`, `release;order=${order.id}`)
      : await (await escrow.approveAndRelease(onchainId)).wait();
    setLastTxHash(receipt.hash);
    await patchOrder(order.id, { status: "released" });
  };

  const releaseSimulated = async () => {
    await patchOrder(order.id, { status: "released" });
  };

  // Dispute — refund after deadline + grace period
  const GRACE_DAYS = 7;
  const isRefundable = (() => {
    // Refund applies ONLY to a funded, undelivered order — the escrow contract
    // permits refund only in Funded state. Once delivered/released/refunded, the
    // refund path is closed (a delivered order is reviewed & released, or disputed).
    if (order.status !== "funded") return false;
    if (!order.deadline) return false;
    const deadlineMs = new Date(order.deadline).getTime();
    const graceMs = GRACE_DAYS * 86400 * 1000;
    return Date.now() > deadlineMs + graceMs;
  })();
  const daysUntilRefundable = (() => {
    if (!order.deadline) return null;
    const deadlineMs = new Date(order.deadline).getTime();
    const graceMs = GRACE_DAYS * 86400 * 1000;
    const remaining = deadlineMs + graceMs - Date.now();
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / (86400 * 1000));
  })();

  const refundOnChain = async () => {
    const { signer } = await connectWallet();
    const escrow = getEscrowWithSigner(signer);
    const onchainId = order.onchain_id ?? order.id;
    const receipt = USE_MEMO
      ? await sendWithMemo(signer, ESCROW_ADDRESS, escrow.interface, "refund", [onchainId], `FB-${order.id}`, `refund;order=${order.id}`)
      : await (await escrow.refund(onchainId)).wait();
    setLastTxHash(receipt.hash);
    await patchOrder(order.id, { status: "refunded" });
  };

  const refundSimulated = async () => {
    await patchOrder(order.id, { status: "refunded" });
  };

  // Freelancer records their payout wallet so the escrow can pay THEM on-chain
  // (must happen before the client funds — the address is baked into createAndFund).
  // This block only renders for the order's freelancer (role check), so pass the
  // order's freelancer_email as the identity — otherwise a mismatched localStorage
  // email silently 403s and the wallet never saves.
  const connectPayoutWallet = async () => {
    const { address } = await connectWallet();
    await setFreelancerWallet(order.id, address, order.freelancer_email);
    setLastTxHash(null);
  };

  // Freelancer submits: mark Delivered on-chain (their wallet signs submitDelivery
  // so the client can then release on-chain) + persist and AI-verify off-chain.
  const submitDeliverable = async () => {
    // The deliverable is either uploaded files, a link, or both. The URL sent to
    // verification / stored for the client is the typed link if given, else the
    // first uploaded file's public URL (which is reachable, so verify works).
    const url = deliverable.trim() || deliverableFiles[0]?.url || "";
    if (!url) {
      throw new Error("Upload your work (file/photo) or paste a link before submitting.");
    }
    const onchainId = order.onchain_id ?? order.id;
    if (hasOnchain) {
      const st = await onChainStatus(onchainId);
      // Don't persist "delivered" off-chain if we couldn't record it on-chain —
      // that would deadlock release (DB says delivered, chain still Funded).
      if (st === -1) {
        throw new Error("Couldn't reach the escrow on-chain to record delivery. Nothing was submitted — please try again in a moment.");
      }
      if (st === 1) {
        const { signer } = await connectWallet();
        const escrow = getEscrowWithSigner(signer);
        const receipt = await (await escrow.submitDelivery(onchainId, url)).wait();
        setLastTxHash(receipt.hash);
      }
      // st === 2: already Delivered on-chain (idempotent). st === 0: demo order
      // (never on-chain) — fine to record the deliverable off-chain.
    }
    const v = await verifyDeliverable(order.id, url, order.freelancer_email, deliverableFiles);
    setVerdict(v);
  };

  // Settle the escrow. The off-chain ("simulated") path only marks the DB — it
  // moves NO money — so we take it ONLY for a genuine demo order that was never
  // created on-chain (status 0). For a real on-chain order we require the exact
  // contract state; we NEVER fake a settle on a read failure (-1) or a
  // wrong-but-real state, because that would tell the user their money moved
  // when it did not.
  const releaseAuto = async () => {
    const st = hasOnchain ? await onChainStatus(order.onchain_id ?? order.id) : 0;
    if (st === 2) return releaseOnChain();
    if (st === -1) throw new Error("Couldn't read the escrow on-chain (network hiccup). Nothing was changed — please try again in a moment.");
    if (st === 1) throw new Error("The delivery isn't recorded on-chain yet, so the payment can't be released on-chain. Ask the freelancer to (re)submit the deliverable — they sign an on-chain delivery — then release.");
    if (st === 3) throw new Error("This order was already released to the freelancer.");
    return releaseSimulated(); // st === 0: demo order, never on-chain — safe to settle off-chain
  };
  const refundAuto = async () => {
    const st = hasOnchain ? await onChainStatus(order.onchain_id ?? order.id) : 0;
    if (st === 1) return refundOnChain();
    if (st === -1) throw new Error("Couldn't read the escrow on-chain (network hiccup). Nothing was changed — please try again in a moment.");
    if (st === 2) throw new Error("Work was already delivered on-chain — a refund only applies to a funded, undelivered order. Review the delivery and release, or resolve the dispute directly.");
    if (st === 4) throw new Error("This order was already refunded.");
    return refundSimulated(); // st === 0: demo order, never on-chain — safe to settle off-chain
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Coins className="h-4 w-4 text-brand" />
        <p className="font-display text-sm uppercase tracking-wider text-slate-900">Actions</p>
      </div>

      {/* Guided next step — tells the current viewer exactly what to do now */}
      {(() => {
        const s = order.status;
        let hint: string | null = null;
        if (role === "client") {
          if (s === "draft" && order.is_public) hint = "Your job is live in the marketplace. Wait for freelancers to apply, accept one (Applications), then fund the escrow.";
          else if (s === "draft" && !order.freelancer_wallet) hint = "Waiting for the freelancer to connect their payout wallet — you can fund once they do.";
          else if (s === "draft") hint = "Fund the escrow to lock USDC until the work is approved.";
          else if (s === "funded") hint = "Funded ✓. The freelancer submits their work and the AI verifies it — then you review the deliverable and release the payment.";
          else if (s === "delivered") hint = "The freelancer delivered and the AI posted its verdict. Review the deliverable, then release the payment if you approve.";
        } else {
          if (s === "draft" && !order.freelancer_wallet) hint = "Connect your payout wallet below so the client can fund the escrow to you.";
          else if (s === "draft") hint = "Payout wallet set ✓. Waiting for the client to fund the escrow.";
          else if (s === "funded") hint = "Submit your deliverable — you sign an on-chain delivery and the AI verifies it. The client then reviews it and releases your payment.";
          else if (s === "delivered") hint = "Submitted ✓. Waiting for the client to review and release your payment.";
        }
        return hint ? (
          <div className="rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-700">
            <span className="font-semibold uppercase tracking-wider text-brand">Next step · </span>
            {hint}
          </div>
        ) : null;
      })()}

      {/* Show the submitted deliverable so the client can actually review the
          work before releasing (parties only — scrubbed for the public). */}
      {order.deliverable_url && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-sky-700">
            Deliverable submitted
          </p>
          <a
            href={order.deliverable_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 break-all font-mono text-[11px] text-sky-900 hover:underline"
          >
            {order.deliverable_url}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
          {isImageUrl(order.deliverable_url) && (
            <a href={order.deliverable_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
              {/* Preview the delivered image inline so the client can review at a glance */}
              <img
                src={order.deliverable_url}
                alt="Delivered work preview"
                className="max-h-56 w-full rounded-lg border border-sky-200 object-contain"
              />
            </a>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-slate-500">
            Open it and review the work before releasing payment.
          </p>
        </div>
      )}

      {role === "freelancer" && order.status === "draft" && !order.freelancer_wallet && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-800">Connect payout wallet</p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-600">
            Connect the wallet you want to be paid to — the client funds the escrow to this address. Do this before they fund.
          </p>
          <button
            disabled={busy}
            onClick={() => run(connectPayoutWallet)}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-display text-xs uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            <Wallet className="h-3.5 w-3.5" />
            {busy ? "Connecting…" : "Connect payout wallet"}
          </button>
        </div>
      )}

      {order.freelancer_wallet && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 font-mono text-[10px] text-emerald-800">
          Freelancer payout wallet set: {order.freelancer_wallet.slice(0, 6)}…{order.freelancer_wallet.slice(-4)} ✓
        </div>
      )}

      {/* Undo a wrong accept — only before funding, since the counterparty is
          part of the escrow terms once USDC is locked. */}
      {role === "client" && order.status === "draft" && !order.is_public &&
        order.freelancer_email && order.freelancer_email !== order.client_email && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          {!confirmUnassign ? (
            <button
              onClick={() => setConfirmUnassign(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-rose-700 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              Change freelancer
            </button>
          ) : (
            <>
              <p className="font-mono text-[11px] leading-relaxed text-slate-700">
                Remove <span className="font-semibold">{order.freelancer_email}</span> from this order?
                The job goes back on the marketplace, their payout wallet is cleared, and their
                application returns to pending so you can pick someone else.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => run(async () => {
                    await unassignFreelancer(order.id, order.client_email);
                    setConfirmUnassign(false);
                  })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {busy ? "Removing…" : "Yes, remove them"}
                </button>
                <button
                  onClick={() => setConfirmUnassign(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-slate-600"
                >
                  Keep
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {role === "client" && order.status === "draft" && !order.is_public && (
        <button
          disabled={busy}
          onClick={() => run(hasOnchain ? fundOnChain : fundSimulated)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          <ArrowRightCircle className="h-4 w-4" />
          {busy ? "Sending…" : hasOnchain
            ? `Fund ${order.amount_usdc} USDC on Arc`
            : `Fund ${order.amount_usdc} USDC (simulated)`}
        </button>
      )}

      {role === "freelancer" && order.status === "funded" && (
        <div className="space-y-3">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-600">
              Upload your work
            </span>
            <p className="mb-1.5 mt-1 font-mono text-[10px] tracking-wide text-slate-400">
              Attach the actual files/photos you made — or paste a link below.
            </p>
            <FileDropzone
              value={deliverableFiles}
              onChange={setDeliverableFiles}
              uploadedBy={order.freelancer_email}
              pathPrefix={`deliverables/${order.id}`}
              disabled={busy}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">or a link</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-600">
              Deliverable link
            </span>
            <input
              type="url"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="https://figma.com/file/... (optional if you uploaded files)"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand"
            />
            <span className="mt-1 block font-mono text-[10px] tracking-wide text-slate-400">
              Agent will check reachability, deadline, and brief alignment.
            </span>
          </label>
          <button
            disabled={busy || (!deliverable.trim() && deliverableFiles.length === 0)}
            onClick={() => run(submitDeliverable)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            <CheckCircle2 className="h-4 w-4" />
            {busy ? "Verifying…" : "Submit deliverable"}
          </button>
        </div>
      )}

      {role === "client" && order.status === "delivered" && (
        <div className="space-y-2">
          {/* Non-custodial by design: the agent verifies autonomously, but only
              the client's signature moves the USDC. Framed as a trust feature. */}
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-violet-700">
              🤖 AI-verified · you keep the keys
            </p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-600">
              The agent already ran the checks (reachability, deadline, brief match) — verdict below.
              Non-custodial: no one moves your USDC until <span className="font-semibold">you</span> approve.
              One click settles it on-chain to the freelancer.
            </p>
          </div>
          <button
            disabled={busy}
            onClick={() => run(releaseAuto)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-emerald-500/30 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            <CheckCircle2 className="h-4 w-4" />
            {busy ? "Sending…" : hasOnchain
              ? `Approve & release ${order.amount_usdc} USDC`
              : `Approve & release ${order.amount_usdc} USDC (simulated)`}
          </button>
        </div>
      )}

      {lastTxHash && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-700">
            Transaction confirmed
          </p>
          <a
            href={txUrl(lastTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 break-all font-mono text-[11px] text-emerald-900 hover:underline"
          >
            {lastTxHash.slice(0, 10)}…{lastTxHash.slice(-8)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {verdict && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Agent verdict</p>
          <p className="mt-1 font-display text-sm uppercase">
            <span className={verdict.verified ? "text-emerald-700" : "text-amber-700"}>
              {verdict.verified ? "Ready to release" : "Hold for review"}
            </span>
            <span className="ml-2 font-mono text-[10px] text-slate-400">
              ({verdict.confidence} confidence)
            </span>
          </p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-700">
            {verdict.reasoning}
          </p>
        </div>
      )}

      {order.status === "released" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-mono text-xs uppercase tracking-wider text-emerald-700">
          ✓ Payment released to freelancer · order complete
        </div>
      )}
      {order.status === "refunded" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-mono text-xs uppercase tracking-wider text-rose-700">
          ↩ Refunded to client · order complete
        </div>
      )}

      {/* Dispute resolution — only for a funded, undelivered order (refund path) */}
      {order.status === "funded" && order.deadline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-800">
                Dispute / refund path
              </p>
              {isRefundable ? (
                <>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-700">
                    Deadline + {GRACE_DAYS}-day grace period has passed. Either party
                    may trigger a refund. Funds return to the client on-chain.
                  </p>
                  <button
                    disabled={busy}
                    onClick={() => run(refundAuto)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-display text-xs uppercase tracking-wider text-amber-800 shadow-sm transition-colors hover:bg-amber-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {busy ? "Sending…" : hasOnchain ? "Request refund on Arc" : "Request refund (simulated)"}
                  </button>
                </>
              ) : (
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-600">
                  If the deliverable isn&apos;t submitted, refund unlocks
                  {daysUntilRefundable != null ? ` in ${daysUntilRefundable} day${daysUntilRefundable === 1 ? "" : "s"}` : " after the grace period"} .
                  Either party can then call refund on the contract to return funds to the client.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-mono text-xs text-rose-700">
          {error}
        </div>
      )}

      <details className="border-t border-slate-100 pt-3">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {hasOnchain ? "Contract details" : "On-chain not configured"}
        </summary>
        <div className="mt-2 space-y-2 font-mono text-[10px] leading-relaxed text-slate-500">
          {hasOnchain ? (
            <>
              <p>
                Contract:{" "}
                <a
                  href={`https://testnet.arcscan.app/address/${ESCROW_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  {ESCROW_ADDRESS.slice(0, 8)}…{ESCROW_ADDRESS.slice(-6)}
                </a>
              </p>
              <p>
                Fund + Release call the contract on Arc Testnet. Your wallet
                pays gas in USDC and signs each transaction.
              </p>
            </>
          ) : (
            <p>
              Set <code className="text-brand">NEXT_PUBLIC_ESCROW_ADDRESS</code> to
              enable real on-chain fund/release.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
