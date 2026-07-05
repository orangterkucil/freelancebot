import Link from "next/link";
import type { Order } from "@/lib/orders";
import { StatusBadge } from "./StatusBadge";
import { ArrowUpRight } from "lucide-react";

export function OrderCard({ order, perspective }: { order: Order; perspective: "client" | "freelancer" }) {
  const counterparty = perspective === "client" ? order.freelancer_email : order.client_email;
  const counterpartyLabel = perspective === "client" ? "Freelancer" : "Client";

  return (
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
  );
}
