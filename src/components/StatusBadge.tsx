import type { OrderStatus } from "@/lib/orders";

const STYLES: Record<OrderStatus, string> = {
  draft:     "bg-slate-100 text-slate-700 ring-slate-200",
  funded:    "bg-amber-100 text-amber-800 ring-amber-200",
  delivered: "bg-sky-100 text-sky-800 ring-sky-200",
  released:  "bg-emerald-100 text-emerald-800 ring-emerald-200",
  refunded:  "bg-rose-100 text-rose-800 ring-rose-200",
  disputed:  "bg-violet-100 text-violet-800 ring-violet-200",
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
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ring-1 " +
        (STYLES[status] ?? STYLES.draft)
      }
    >
      {LABELS[status] ?? status}
    </span>
  );
}
