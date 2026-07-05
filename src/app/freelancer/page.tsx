"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Search, Sparkles, Plus, Megaphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmailGate } from "@/components/EmailGate";
import { OrderCard } from "@/components/OrderCard";
import { CreateOrderForm } from "@/components/CreateOrderForm";
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
  const [showPostService, setShowPostService] = useState(false);

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
    total:    orders.length,
    funded:   orders.filter((o) => o.status === "funded").length,
    awaiting: orders.filter((o) => o.status === "delivered").length,
    earned:   orders.filter((o) => o.status === "released").reduce((s, o) => s + Number(o.amount_usdc), 0),
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
          Signed in as <span className="text-slate-700">{email}</span>
          {" · "}
          <button onClick={signOut} className="text-brand hover:underline">switch</button>
        </>
      }
      breadcrumb={<>Freelancer / Orders</>}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total orders"     value={stats.total}    accent="sky" />
        <Stat label="Newly funded"     value={stats.funded}   accent="amber" />
        <Stat label="Awaiting release" value={stats.awaiting} accent="indigo" />
        <Stat label="Total earned"     value={`$${stats.earned.toLocaleString()}`} sub="USDC" accent="emerald" />
      </div>

      {/* Two ways for freelancers to find work: browse jobs OR post their own service */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-sky-200">
              <Sparkles className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-brand">
                Browse the marketplace
              </p>
              <p className="mt-1 font-display text-base uppercase text-slate-900">
                Find open jobs
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                Filter by field, budget, deadline. Apply with one click.
              </p>
            </div>
          </div>
          <Link
            href="/jobs"
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs uppercase tracking-wider self-start"
          >
            Browse jobs →
          </Link>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-violet-200">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-violet-600">
                Offer your services
              </p>
              <p className="mt-1 font-display text-base uppercase text-slate-900">
                Post a service listing
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                Clients browse services and hire you. Reverse marketplace.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPostService((s) => !s)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 font-display text-xs uppercase tracking-wider text-violet-700 shadow-sm transition-colors hover:border-violet-500 self-start"
          >
            <Plus className="h-4 w-4" />
            {showPostService ? "Close" : "Post a service"}
          </button>
        </div>
      </div>

      {showPostService && (
        <div className="mt-6">
          <CreateOrderForm
            clientEmail={email}
            posterRole="freelancer"
            onCreated={() => { setShowPostService(false); load(); }}
          />
        </div>
      )}

      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl uppercase text-slate-900">My orders</h2>

          {orders.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brief, client, ID..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand sm:w-72"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={
                      "shrink-0 rounded-md px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors " +
                      (statusFilter === f.value
                        ? "bg-brand text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Loading…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-rose-700">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-10 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-sky-200">
              <Inbox className="h-7 w-7 text-brand" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 font-display text-xl uppercase text-slate-900">
              No incoming orders yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm font-mono text-xs uppercase leading-relaxed tracking-wide text-slate-600">
              Browse the public marketplace and apply to open jobs.
            </p>
            <Link
              href="/jobs"
              className="btn-gradient mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-display text-sm uppercase tracking-wider"
            >
              Browse marketplace →
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
              No orders match this filter.
            </p>
            <button
              onClick={() => { setStatusFilter("all"); setSearch(""); }}
              className="mt-3 font-mono text-xs text-brand hover:underline"
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
  accent = "sky",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "sky" | "amber" | "emerald" | "indigo";
}) {
  const accentMap = {
    sky:     "from-sky-50 to-white text-sky-700 ring-sky-200",
    amber:   "from-amber-50 to-white text-amber-700 ring-amber-200",
    emerald: "from-emerald-50 to-white text-emerald-700 ring-emerald-200",
    indigo:  "from-indigo-50 to-white text-indigo-700 ring-indigo-200",
  };
  return (
    <div className={`relative rounded-2xl bg-gradient-to-br p-4 ring-1 shadow-sm ${accentMap[accent]}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl">
        {value}
        {sub && <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">{sub}</span>}
      </p>
    </div>
  );
}
