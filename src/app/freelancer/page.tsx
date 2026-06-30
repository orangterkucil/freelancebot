"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmailGate } from "@/components/EmailGate";
import { OrderCard } from "@/components/OrderCard";
import { listOrders } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/orders";

const STATUS_FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "funded",    label: "Funded" },
  { value: "delivered", label: "Delivered" },
  { value: "released",  label: "Released" },
  { value: "refunded",  label: "Refunded" },
];

export default function FreelancerPage() {
  return (
    <EmailGate storageKey="fb_freelancer_email" label="Sign in as freelancer">
      {(email, signOut) => <FreelancerDashboard email={email} signOut={signOut} />}
    </EmailGate>
  );
}

function FreelancerDashboard({ email, signOut }: { email: string; signOut: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { orders } = await listOrders(email);
      setOrders(orders.filter((o) => o.freelancer_email === email));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const stats = {
    total:        orders.length,
    funded:       orders.filter((o) => o.status === "funded").length,
    awaiting:     orders.filter((o) => o.status === "delivered").length,
    earned:       orders.filter((o) => o.status === "released").reduce((s, o) => s + Number(o.amount_usdc), 0),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const blob = `${o.brief} ${o.client_email} ${o.id}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <AppShell
      title="Freelancer dashboard"
      subtitle={
        <>
          Signed in as <span className="text-cream/80">{email}</span>
          {" · "}
          <button onClick={signOut} className="text-signal hover:underline">switch</button>
        </>
      }
      breadcrumb={<>Freelancer / Orders</>}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total orders"        value={stats.total} />
        <Stat label="Newly funded"        value={stats.funded}   accent="amber" />
        <Stat label="Awaiting release"    value={stats.awaiting} accent="signal" />
        <Stat label="Total earned"        value={`$${stats.earned.toLocaleString()}`} sub="USDC" accent="signal" />
      </div>

      {/* Find work CTA */}
      <div className="liquid-glass mt-8 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Looking for new work?
          </p>
          <p className="mt-1 font-display text-base uppercase text-cream">
            Browse the public marketplace
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-cream/50">
            Coming v0.9.0 — public job feed with filter by field, budget, deadline.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 font-display text-xs uppercase tracking-wider text-cream/80 transition-colors hover:bg-white/[0.08] hover:text-signal"
        >
          Browse jobs →
        </Link>
      </div>

      {/* Orders list */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl uppercase text-cream">My orders</h2>

          {orders.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brief, client, ID..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 font-mono text-xs text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08] sm:w-72"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={
                      "shrink-0 rounded-md px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors " +
                      (statusFilter === f.value
                        ? "bg-signal text-ink"
                        : "text-cream/60 hover:text-cream")
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="liquid-glass rounded-2xl p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-cream/50">Loading…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-rose-300">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="liquid-glass relative rounded-3xl p-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-signal/10 ring-1 ring-signal/30">
              <Inbox className="h-7 w-7 text-signal" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 font-display text-xl uppercase text-cream">
              No incoming orders yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm font-mono text-xs uppercase leading-relaxed tracking-wide text-cream/60">
              Ask a client to create an order on the client dashboard using your
              email: <span className="text-signal">{email}</span>. Once they fund
              the escrow, it shows up here for you to deliver.
            </p>
            <Link
              href="/jobs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 font-display text-sm uppercase tracking-wider text-cream/80 hover:text-signal"
            >
              Browse marketplace →
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && filtered.length === 0 && (
          <div className="liquid-glass rounded-2xl p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-cream/50">
              No orders match this filter.
            </p>
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
              }}
              className="mt-3 font-mono text-xs text-signal hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} perspective="freelancer" />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "signal" | "amber";
}) {
  const accentColor =
    accent === "signal" ? "text-signal" :
    accent === "amber"  ? "text-amber-300" :
                          "text-cream";
  return (
    <div className="liquid-glass relative rounded-2xl p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accentColor}`}>
        {value}
        {sub && <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">{sub}</span>}
      </p>
    </div>
  );
}
