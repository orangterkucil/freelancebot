import Link from "next/link";
import type { Order } from "@/lib/orders";
import { StatusBadge } from "./StatusBadge";

export function OrderCard({ order, perspective }: { order: Order; perspective: "client" | "freelancer" }) {
  const counterparty = perspective === "client" ? order.freelancer_email : order.client_email;
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">
            #{order.id} · {order.brief}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {perspective === "client" ? "Freelancer" : "Client"}: {counterparty}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>${order.amount_usdc.toLocaleString()} USDC</span>
        <span>
          {order.deadline
            ? `Due ${new Date(order.deadline).toLocaleDateString()}`
            : "No deadline"}
        </span>
      </div>
    </Link>
  );
}
