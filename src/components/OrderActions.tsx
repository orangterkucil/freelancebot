"use client";

import { useState } from "react";
import type { Order } from "@/lib/orders";
import { patchOrder, verifyDeliverable } from "@/lib/api";

/**
 * Action panel that appears next to the chat. Different actions per role and status.
 *
 * For the MVP, "fund" and "release" are simulated by PATCH-ing the order status,
 * because the on-chain escrow contract hasn't been deployed yet. Week 6 swaps
 * these in with real ethers.js calls to the deployed contract.
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

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Actions</h3>

      {/* CLIENT: fund the order */}
      {role === "client" && order.status === "draft" && (
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              // SIMULATED on-chain fund. Real version: ethers.js → escrow.createAndFund(...)
              await patchOrder(order.id, {
                onchain_id: order.id, // will be replaced by real on-chain id week 6
                status: "funded",
              });
            })
          }
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "…" : `Fund ${order.amount_usdc} USDC (simulated)`}
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

      {/* CLIENT: approve and release */}
      {role === "client" && order.status === "delivered" && (
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              // SIMULATED on-chain release. Real version: escrow.approveAndRelease(orderId)
              await patchOrder(order.id, { status: "released" });
            })
          }
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "…" : `Approve & release ${order.amount_usdc} USDC (simulated)`}
        </button>
      )}

      {/* Verdict display */}
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
        <summary className="cursor-pointer">On-chain state (week 6)</summary>
        <p className="mt-2">
          Once the FreelanceEscrow contract is deployed to Arc testnet, &quot;Fund&quot; and
          &quot;Release&quot; will call <code>createAndFund</code> and{" "}
          <code>approveAndRelease</code> respectively, settling in USDC with sub-second
          finality. The on-chain order id will be stored in <code>onchain_id</code>.
        </p>
      </details>
    </div>
  );
}
