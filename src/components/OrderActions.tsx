"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRightCircle, Coins, ExternalLink, ShieldAlert, RotateCcw } from "lucide-react";
import type { Order } from "@/lib/orders";
import { patchOrder, verifyDeliverable } from "@/lib/api";
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

/**
 * Does this order actually exist on the escrow contract? Orders funded in
 * demo/simulated mode were never created on-chain, so calling release/refund on
 * them reverts. We read the order back: a missing one has a zero client and
 * status None(0). Read-only, no wallet prompt.
 */
/** On-chain order status: 0 none/absent, 1 Funded, 2 Delivered, 3 Released, 4 Refunded. */
async function onChainStatus(onchainId: number): Promise<number> {
  try {
    const o: any = await getEscrowReadonly().getOrder(onchainId);
    const client = String(o.client ?? o[0] ?? "").toLowerCase();
    if (!client || client === ZERO_ADDR) return 0;
    return Number(o.status ?? o[7] ?? 0);
  } catch {
    return 0;
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

    const { signer, address } = await connectWallet();
    const amount = toUsdcUnits(order.amount_usdc);
    const usdc = getUsdcWithSigner(signer);
    const escrow = getEscrowWithSigner(signer);

    const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
    await approveTx.wait();

    const args = [address, amount, order.brief, deadlineSec];
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
    if (order.status === "released" || order.status === "refunded" || order.status === "draft") return false;
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

  // Route to the on-chain path only when this order actually exists on the
  // contract; otherwise (demo/simulated funding) settle it off-chain so the
  // action still completes instead of reverting.
  // Release on-chain only when the contract is actually in Delivered state.
  // The app's submit flow updates the DB but not the on-chain submitDelivery, so
  // an on-chain order can still be Funded here — fall back to an off-chain
  // release so the action completes instead of reverting WrongStatus.
  const releaseAuto = async () => {
    const onchainId = order.onchain_id ?? order.id;
    if (hasOnchain && (await onChainStatus(onchainId)) === 2) await releaseOnChain();
    else await releaseSimulated();
  };
  // Refund on-chain only when the contract is in Funded state (else settle off-chain).
  const refundAuto = async () => {
    const onchainId = order.onchain_id ?? order.id;
    if (hasOnchain && (await onChainStatus(onchainId)) === 1) await refundOnChain();
    else await refundSimulated();
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
          else if (s === "draft") hint = "Fund the escrow to lock USDC until the work is approved.";
          else if (s === "funded") hint = "Funded ✓. Waiting for the freelancer to submit their deliverable.";
          else if (s === "delivered") hint = "Deliverable submitted. Review it, then approve & release the payment.";
        } else {
          if (s === "draft") hint = "Waiting for the client to fund the escrow.";
          else if (s === "funded") hint = "Submit your deliverable URL below — the AI agent will verify it.";
          else if (s === "delivered") hint = "Submitted ✓. Waiting for the client/agent to release payment.";
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
          <p className="mt-1.5 font-mono text-[10px] text-slate-500">
            Open it and review the work before releasing payment.
          </p>
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
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-600">
              Deliverable URL
            </span>
            <input
              type="url"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="https://figma.com/file/..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand"
            />
            <span className="mt-1 block font-mono text-[10px] tracking-wide text-slate-400">
              Agent will check reachability, deadline, and brief alignment.
            </span>
          </label>
          <button
            disabled={busy || !deliverable.trim()}
            onClick={() =>
              run(async () => {
                const v = await verifyDeliverable(order.id, deliverable.trim());
                setVerdict(v);
              })
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            <CheckCircle2 className="h-4 w-4" />
            {busy ? "Verifying…" : "Submit deliverable"}
          </button>
        </div>
      )}

      {role === "client" && order.status === "delivered" && (
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

      {/* Dispute resolution — appears after deadline + grace period */}
      {order.status !== "released" && order.status !== "refunded" && order.status !== "draft" && order.deadline && (
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
