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
      className="liquid-glass group relative block rounded-2xl p-5 transition-all hover:bg-white/[0.06] hover:ring-1 hover:ring-signal/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
              Order #{order.id}
            </span>
            {order.onchain_id && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal/70">
                · on-chain
              </span>
            )}
          </div>
          <p className="mt-1 truncate font-display text-lg uppercase text-cream">
            {order.brief}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-cream/50">
            {counterpartyLabel}: <span className="text-cream/70">{counterparty}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          <ArrowUpRight className="h-4 w-4 text-cream/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="font-display text-xl text-signal">
          ${order.amount_usdc.toLocaleString()}
          <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
            USDC
          </span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
          {order.deadline
            ? `Due ${new Date(order.deadline).toLocaleDateString()}`
            : "No deadline"}
        </span>
      </div>
    </Link>
  );
}
