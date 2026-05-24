import type { OrderStatus } from "@/lib/orders";

const STYLES: Record<OrderStatus, string> = {
  draft:     "bg-slate-100 text-slate-700",
  funded:    "bg-amber-100 text-amber-800",
  delivered: "bg-blue-100 text-blue-800",
  released:  "bg-emerald-100 text-emerald-800",
  refunded:  "bg-rose-100 text-rose-800",
  disputed:  "bg-purple-100 text-purple-800",
};

const LABELS: Record<OrderStatus, string> = {
  draft:     "Draft",
  funded:    "Funded",
  delivered: "Delivered",
  released:  "Released",
  refunded:  "Refunded",
  disputed:  "Disputed",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
        (STYLES[status] ?? "bg-slate-100 text-slate-700")
      }
    >
      {LABELS[status] ?? status}
    </span>
  );
}
