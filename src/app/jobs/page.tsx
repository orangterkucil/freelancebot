"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Briefcase, Clock, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listJobs } from "@/lib/api";
import { FIELDS, type Order, type Field } from "@/lib/orders";

const FIELD_LABELS: Record<Field | "all", string> = {
  all:       "All fields",
  design:    "Design",
  dev:       "Development",
  writing:   "Writing",
  video:     "Video",
  marketing: "Marketing",
  research:  "Research",
  other:     "Other",
};

const FIELD_EMOJI: Record<Field, string> = {
  design:    "🎨",
  dev:       "⚙️",
  writing:   "✍️",
  video:     "🎬",
  marketing: "📣",
  research:  "🔬",
  other:     "📦",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<Field | "all">("all");
  const [search, setSearch] = useState("");
  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { jobs } = await listJobs({
        field: field === "all" ? undefined : field,
        min:   minBudget || undefined,
        max:   maxBudget || undefined,
        q:     search || undefined,
        limit: 100,
      });
      setJobs(jobs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + reload on filter changes
  useEffect(() => {
    const t = setTimeout(load, 300); // small debounce for search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, search, minBudget, maxBudget]);

  return (
    <AppShell
      title="Marketplace"
      subtitle="Open jobs posted by clients · apply with one click"
      breadcrumb={<>Marketplace / All jobs</>}
    >
      {/* Field chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["all", ...FIELDS] as const).map((f) => (
          <button
            key={f}
            onClick={() => setField(f as Field | "all")}
            className={
              "shrink-0 rounded-full px-4 py-2 font-display text-[11px] uppercase tracking-wider transition-colors " +
              (field === f
                ? "bg-signal text-ink"
                : "border border-white/10 bg-white/[0.04] text-cream/70 hover:bg-white/[0.08] hover:text-cream")
            }
          >
            {f === "all" ? "All" : `${FIELD_EMOJI[f as Field]} ${FIELD_LABELS[f as Field]}`}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brief, title, or keyword..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 font-mono text-xs text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08]"
          />
        </div>
        <div className="flex items-center gap-2">
          <BudgetInput value={minBudget} onChange={setMinBudget} placeholder="Min" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">to</span>
          <BudgetInput value={maxBudget} onChange={setMaxBudget} placeholder="Max" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">USDC</span>
        </div>
      </div>

      {/* Header strip */}
      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-cream/50">
          <Filter className="mr-1.5 inline h-3 w-3" />
          {loading ? "Loading…" : `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} found`}
        </p>
        <Link
          href="/client"
          className="font-mono text-[11px] uppercase tracking-widest text-signal hover:underline"
        >
          + Post a job
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-rose-300">{error}</p>
        </div>
      )}

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>

      {!loading && jobs.length === 0 && !error && <EmptyState />}
    </AppShell>
  );
}

function BudgetInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min={0}
      step="1"
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
      className="w-20 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-xs text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08]"
    />
  );
}

function JobCard({ job }: { job: Order }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="liquid-glass group relative block rounded-2xl p-5 transition-all hover:bg-white/[0.06] hover:ring-1 hover:ring-signal/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cream/60">
            <span>{FIELD_EMOJI[job.field]}</span> {FIELD_LABELS[job.field]}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-cream/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal" />
      </div>

      <h3 className="mt-3 line-clamp-2 font-display text-lg uppercase leading-tight text-cream">
        {job.title ?? job.brief.slice(0, 60)}
      </h3>
      <p className="mt-2 line-clamp-3 font-mono text-[11px] leading-relaxed text-cream/60">
        {job.brief}
      </p>

      <div className="mt-5 flex items-end justify-between border-t border-white/5 pt-3">
        <div>
          <span className="font-display text-xl text-signal">
            ${job.amount_usdc.toLocaleString()}
          </span>
          <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
            USDC
          </span>
        </div>
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
          <Clock className="h-3 w-3" />
          {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open"}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="liquid-glass relative mt-6 rounded-3xl p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-signal/10 ring-1 ring-signal/30">
        <Briefcase className="h-7 w-7 text-signal" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 font-display text-xl uppercase text-cream">No jobs match</h3>
      <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase leading-relaxed tracking-wide text-cream/60">
        Try widening your filters, or check back later — new jobs post all the time.
        If you have a project to commission, post one yourself.
      </p>
      <Link
        href="/client"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 font-display text-sm uppercase tracking-wider text-ink"
      >
        + Post a job
      </Link>
    </div>
  );
}
