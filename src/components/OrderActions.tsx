"use client";

import { useState } from "react";
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

/**
 * Action panel. Role-aware. For status `draft` (client) the user funds the
 * escrow ON-CHAIN: USDC.approve(escrow, amount), then escrow.createAndFund(...).
 * For `funded` (freelancer) it submits the deliverable URL + runs the agent
 * verifier off-chain. For `delivered` (client) it calls approveAndRelease
 * ON-CHAIN. All on-chain steps also sync the DB via PATCH /api/orders/[id].
 *
 * The contract isn't deployed everywhere — if `NEXT_PUBLIC_ESCROW_ADDRESS`
 * isn't set, we fall back to the previous "simulated" mode (DB-only).
 */
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

  // -----------------------------------------------------------------------
  // CLIENT: fund (on-chain) or simulate (DB)
  // -----------------------------------------------------------------------
  const fundOnChain = async () => {
    const { signer, address } = await connectWallet();
    const amount = toUsdcUnits(order.amount_usdc);
    const usdc = getUsdcWithSigner(signer);
    const escrow = getEscrowWithSigner(signer);

    // 1. approve
    const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
    await approveTx.wait();

    // 2. createAndFund
    const deadline = order.deadline ? Math.floor(new Date(order.deadline).getTime() / 1000) : Math.floor(Date.now() / 1000) + 86400 * 7;
    const fundTx = await escrow.createAndFund(
      // pretend the freelancer wallet == the client wallet for demo simplicity
      // in a real app, the freelancer's wallet would be looked up via email→wallet
      address,
      amount,
      order.brief,
      deadline
    );
    const receipt = await fundTx.wait();
    setLastTxHash(receipt.hash);

    // 3. parse OrderFunded event for onchain id
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

    // 4. sync DB
    await patchOrder(order.id, {
      onchain_id: onchainId ?? order.id,
      status: "funded",
    });
  };

  const fundSimulated = async () => {
    await patchOrder(order.id, { onchain_id: order.id, status: "funded" });
  };

  // -----------------------------------------------------------------------
  // CLIENT: release (on-chain) or simulate
  // -----------------------------------------------------------------------
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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Actions</h3>

      {/* CLIENT: fund */}
      {role === "client" && order.status === "draft" && (
        <button
          disabled={busy}
          onClick={() => run(hasOnchain ? fundOnChain : fundSimulated)}
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Sending…" : hasOnchain
            ? `Fund ${order.amount_usdc} USDC on Arc`
            : `Fund ${order.amount_usdc} USDC (simulated)`}
        </button>
      )}

      {/* FREELANCER: submit deliverable */}
      {role === "freelancer" && order.status === "funded" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Deliverable URL</label>
          <input
            type="url"
            value={deliverable}
            onChange={(e) => setDeliverable(e.target.value)}
            placeholder="https://figma.com/file/..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <button
            disabled={busy || !deliverable.trim()}
            onClick={() =>
              run(async () => {
                const v = await verifyDeliverable(order.id, deliverable.trim());
                setVerdict(v);
              })
            }
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Verifying…" : "Submit deliverable"}
          </button>
        </div>
      )}

      {/* CLIENT: approve + release */}
      {role === "client" && order.status === "delivered" && (
        <button
          disabled={busy}
          onClick={() => run(hasOnchain ? releaseOnChain : releaseSimulated)}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Sending…" : hasOnchain
            ? `Approve & release ${order.amount_usdc} USDC on Arc`
            : `Approve & release ${order.amount_usdc} USDC (simulated)`}
        </button>
      )}

      {/* TX receipt */}
      {lastTxHash && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
          <p className="font-semibold text-emerald-900">Transaction confirmed</p>
          <a
            href={txUrl(lastTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block break-all font-mono text-emerald-700 hover:underline"
          >
            {lastTxHash}
          </a>
        </div>
      )}

      {/* Verdict */}
      {verdict && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-semibold">
            Agent verdict:{" "}
            <span className={verdict.verified ? "text-emerald-700" : "text-amber-700"}>
              {verdict.verified ? "ready to release" : "hold for review"}
            </span>{" "}
            <span className="text-xs text-slate-500">({verdict.confidence} confidence)</span>
          </p>
          <p className="mt-1 text-slate-700">{verdict.reasoning}</p>
        </div>
      )}

      {/* Status-specific notes */}
      {order.status === "released" && (
        <p className="text-sm text-emerald-700">
          ✅ Payment released to freelancer. End of order lifecycle.
        </p>
      )}
      {order.status === "refunded" && (
        <p className="text-sm text-rose-700">
          ↩ Refunded to client. End of order lifecycle.
        </p>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer">
          {hasOnchain ? "Contract details" : "On-chain state (not configured)"}
        </summary>
        <div className="mt-2 space-y-1">
          {hasOnchain ? (
            <>
              <p>
                Escrow contract:{" "}
                <a
                  href={`https://testnet.arcscan.app/address/${ESCROW_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-brand hover:underline"
                >
                  {ESCROW_ADDRESS}
                </a>
              </p>
              <p>
                Fund and Release call the contract on Arc Testnet. Your wallet pays
                a small USDC gas fee and signs each transaction.
              </p>
            </>
          ) : (
            <p>
              Set <code>NEXT_PUBLIC_ESCROW_ADDRESS</code> to enable real on-chain
              fund/release calls.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
