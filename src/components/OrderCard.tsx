"use client";

import { useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/orders";
import { StatusBadge } from "./StatusBadge";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { deleteOrder } from "@/lib/api";

export function OrderCard({
  order,
  perspective,
  onDeleted,
}: {
  order: Order;
  perspective: "client" | "freelancer";
  onDeleted?: (id: number) => void;
}) {
  const counterparty = perspective === "client" ? order.freelancer_email : order.client_email;
  const counterpartyLabel = perspective === "client" ? "Freelancer" : "Client";

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deleting is offered only where it is safe: the client's own draft, which has
  // never been funded and so has no on-chain counterpart to fall out of sync with.
  const canDelete = perspective === "client" && order.status === "draft" && order.onchain_id == null;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteOrder(order.id, order.client_email);
      onDeleted?.(order.id);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't delete this order");
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <Link
        href={`/orders/${order.id}`}
        className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                Order #{order.id}
              </span>
              {order.onchain_id && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-brand">
                  · on-chain
                </span>
              )}
            </div>
            <p className="mt-1 truncate font-display text-lg uppercase text-slate-900">
              {order.brief}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
              {counterpartyLabel}: <span className="text-slate-700">{counterparty}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <ArrowUpRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="font-display text-xl text-brand">
            ${order.amount_usdc.toLocaleString()}
            <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
              USDC
            </span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {order.deadline
              ? `Due ${new Date(order.deadline).toLocaleDateString()}`
              : "No deadline"}
          </span>
        </div>
      </Link>

      {/* Kept outside the Link so a delete never navigates by accident. */}
      {canDelete && !confirming && (
        <button
          type="button"
          aria-label={`Delete draft order ${order.id}`}
          onClick={() => setConfirming(true)}
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {canDelete && confirming && (
        <div className="absolute inset-0 grid place-items-center rounded-2xl border border-rose-200 bg-white/95 p-4 backdrop-blur">
          <div className="text-center">
            <p className="font-mono text-[11px] leading-relaxed text-slate-700">
              Delete draft order #{order.id}? Its messages and applications go with it.
              This can&apos;t be undone.
            </p>
            {error && (
              <p className="mt-2 font-mono text-[11px] text-rose-700">{error}</p>
            )}
            <div className="mt-3 flex justify-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => { setConfirming(false); setError(null); }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-slate-600"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
