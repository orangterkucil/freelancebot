import type { OrderStatus } from "@/lib/orders";

const STYLES: Record<OrderStatus, string> = {
  draft:     "bg-white/5 text-cream/70 ring-white/10",
  funded:    "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  delivered: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  released:  "bg-signal/15 text-signal ring-signal/40",
  refunded:  "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  disputed:  "bg-purple-500/15 text-purple-300 ring-purple-400/30",
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
