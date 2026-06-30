"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Inbox, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmailGate } from "@/components/EmailGate";
import { OrderCard } from "@/components/OrderCard";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { listOrders } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/orders";

const STATUS_FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "draft",     label: "Draft" },
  { value: "funded",    label: "Funded" },
  { value: "delivered", label: "Delivered" },
  { value: "released",  label: "Released" },
  { value: "refunded",  label: "Refunded" },
];

export default function ClientPage() {
  return (
    <EmailGate storageKey="fb_client_email" label="Sign in as client">
      {(email, signOut) => <ClientDashboard email={email} signOut={signOut} />}
    </EmailGate>
  );
}

function ClientDashboard({ email, signOut }: { email: string; signOut: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { orders } = await listOrders(email);
      setOrders(orders.filter((o) => o.client_email === email));
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
    total:    orders.length,
    active:   orders.filter((o) => ["draft", "funded", "delivered"].includes(o.status)).length,
    released: orders.filter((o) => o.status === "released").length,
    locked:   orders.filter((o) => o.status === "funded" || o.status === "delivered").reduce((s, o) => s + Number(o.amount_usdc), 0),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const blob = `${o.brief} ${o.freelancer_email} ${o.id}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <AppShell
      title="Client dashboard"
      subtitle={
        <>
          Signed in as <span className="text-cream/80">{email}</span>
          {" · "}
          <button onClick={signOut} className="text-signal hover:underline">switch</button>
        </>
      }
      breadcrumb={<>Client / Orders</>}
      actions={
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-display text-xs uppercase tracking-wider text-ink transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close" : "New order"}
        </button>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total orders"     value={stats.total} />
        <Stat label="Active"            value={stats.active}   accent="amber" />
        <Stat label="Released"          value={stats.released} accent="signal" />
        <Stat label="Locked in escrow" value={`$${stats.locked.toLocaleString()}`} sub="USDC" />
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mt-8">
          <CreateOrderForm
            clientEmail={email}
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {/* Orders list */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl uppercase text-cream">History</h2>

          {orders.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brief, freelancer, ID..."
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

          {orders.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40 sm:ml-2">
              {filtered.length} of {orders.length}
            </span>
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
          <EmptyState onCreate={() => setShowForm(true)} />
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
            <OrderCard key={o.id} order={o} perspective="client" />
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="liquid-glass relative rounded-3xl p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-signal/10 ring-1 ring-signal/30">
        <Inbox className="h-7 w-7 text-signal" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 font-display text-xl uppercase text-cream">No orders yet</h3>
      <p className="mx-auto mt-2 max-w-sm font-mono text-xs uppercase leading-relaxed tracking-wide text-cream/60">
        Create an escrow to hire a freelancer. USDC locks on Arc, the AI agent verifies the deliverable, and you release when ready.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" />
        Create first order
      </button>

      <div className="mt-8 grid gap-2 text-left sm:grid-cols-3">
        {[
          { step: "01", title: "Fund",    desc: "Lock USDC in the on-chain escrow with one signed tx." },
          { step: "02", title: "Verify",  desc: "Agent checks deliverable URL, deadline, brief alignment." },
          { step: "03", title: "Release", desc: "Approve and the freelancer receives funds in <1 sec." },
        ].map((s) => (
          <div key={s.step} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-signal">Step {s.step}</span>
            <p className="mt-1 font-display text-sm uppercase text-cream">{s.title}</p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-cream/50">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
