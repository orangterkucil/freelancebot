"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRightCircle, Coins, ExternalLink } from "lucide-react";
import type { Order } from "@/lib/orders";
import { patchOrder, verifyDeliverable } from "@/lib/api";
import {
  connectWallet,
  getEscrowWithSigner,
  getUsdcWithSigner,
  toUsdcUnits,
  ESCROW_ADDRESS,
  txUrl,
} from "@/lib/contracts";

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
      setError(e?.shortMessage ?? e?.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const fundOnChain = async () => {
    const { signer, address } = await connectWallet();
    const amount = toUsdcUnits(order.amount_usdc);
    const usdc = getUsdcWithSigner(signer);
    const escrow = getEscrowWithSigner(signer);

    const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
    await approveTx.wait();

    const deadline = order.deadline ? Math.floor(new Date(order.deadline).getTime() / 1000) : Math.floor(Date.now() / 1000) + 86400 * 7;
    const fundTx = await escrow.createAndFund(address, amount, order.brief, deadline);
    const receipt = await fundTx.wait();
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
    const tx = await escrow.approveAndRelease(onchainId);
    const receipt = await tx.wait();
    setLastTxHash(receipt.hash);
    await patchOrder(order.id, { status: "released" });
  };

  const releaseSimulated = async () => {
    await patchOrder(order.id, { status: "released" });
  };

  return (
    <div className="liquid-glass relative space-y-4 rounded-2xl p-5">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <Coins className="h-4 w-4 text-signal" />
        <p className="font-display text-sm uppercase tracking-wider text-cream">Actions</p>
      </div>

      {/* CLIENT: fund */}
      {role === "client" && order.status === "draft" && (
        <button
          disabled={busy}
          onClick={() => run(hasOnchain ? fundOnChain : fundSimulated)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          <ArrowRightCircle className="h-4 w-4" />
          {busy ? "Sending…" : hasOnchain
            ? `Fund ${order.amount_usdc} USDC on Arc`
            : `Fund ${order.amount_usdc} USDC (simulated)`}
        </button>
      )}

      {/* FREELANCER: submit deliverable */}
      {role === "freelancer" && order.status === "funded" && (
        <div className="space-y-3">
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-cream/60">
              Deliverable URL
            </span>
            <input
              type="url"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="https://figma.com/file/..."
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08]"
            />
            <span className="mt-1 block font-mono text-[10px] tracking-wide text-cream/30">
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            <CheckCircle2 className="h-4 w-4" />
            {busy ? "Verifying…" : "Submit deliverable"}
          </button>
        </div>
      )}

      {/* CLIENT: approve + release */}
      {role === "client" && order.status === "delivered" && (
        <button
          disabled={busy}
          onClick={() => run(hasOnchain ? releaseOnChain : releaseSimulated)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          <CheckCircle2 className="h-4 w-4" />
          {busy ? "Sending…" : hasOnchain
            ? `Approve & release ${order.amount_usdc} USDC`
            : `Approve & release ${order.amount_usdc} USDC (simulated)`}
        </button>
      )}

      {/* TX receipt */}
      {lastTxHash && (
        <div className="rounded-xl border border-signal/30 bg-signal/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal">
            Transaction confirmed
          </p>
          <a
            href={txUrl(lastTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 break-all font-mono text-[11px] text-cream/80 hover:text-signal"
          >
            {lastTxHash.slice(0, 10)}…{lastTxHash.slice(-8)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Verdict */}
      {verdict && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Agent verdict</p>
          <p className="mt-1 font-display text-sm uppercase">
            <span className={verdict.verified ? "text-signal" : "text-amber-300"}>
              {verdict.verified ? "Ready to release" : "Hold for review"}
            </span>
            <span className="ml-2 font-mono text-[10px] text-cream/40">
              ({verdict.confidence} confidence)
            </span>
          </p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-cream/70">
            {verdict.reasoning}
          </p>
        </div>
      )}

      {/* Final states */}
      {order.status === "released" && (
        <div className="rounded-xl border border-signal/30 bg-signal/10 p-3 font-mono text-xs uppercase tracking-wider text-signal">
          ✓ Payment released to freelancer · order complete
        </div>
      )}
      {order.status === "refunded" && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 font-mono text-xs uppercase tracking-wider text-rose-300">
          ↩ Refunded to client · order complete
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-300">
          {error}
        </div>
      )}

      <details className="border-t border-white/5 pt-3">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-cream/40">
          {hasOnchain ? "Contract details" : "On-chain not configured"}
        </summary>
        <div className="mt-2 space-y-2 font-mono text-[10px] leading-relaxed text-cream/50">
          {hasOnchain ? (
            <>
              <p>
                Contract:{" "}
                <a
                  href={`https://testnet.arcscan.app/address/${ESCROW_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-signal hover:underline"
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
              Set <code className="text-signal">NEXT_PUBLIC_ESCROW_ADDRESS</code> to
              enable real on-chain fund/release.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
