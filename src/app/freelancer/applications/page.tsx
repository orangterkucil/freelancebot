"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ExternalLink, Inbox } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmailGate } from "@/components/EmailGate";
import { listMyApplications } from "@/lib/api";
import type { Application } from "@/lib/orders";

export default function FreelancerApplicationsPage() {
  return (
    <EmailGate storageKey="fb_freelancer_email" label="Sign in as freelancer">
      {(email, signOut) => <MyApplications email={email} signOut={signOut} />}
    </EmailGate>
  );
}

function MyApplications({ email, signOut }: { email: string; signOut: () => void }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const { applications } = await listMyApplications(email);
        setApps(applications);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load applications");
      } finally { setLoading(false); }
    })();
  }, [email]);

  const grouped = {
    pending:   apps.filter((a) => a.status === "pending"),
    accepted:  apps.filter((a) => a.status === "accepted"),
    rejected:  apps.filter((a) => a.status === "rejected"),
    withdrawn: apps.filter((a) => a.status === "withdrawn"),
  };

  return (
    <AppShell
      title="My applications"
      subtitle={
        <>
          Signed in as <span className="text-slate-700">{email}</span>
          {" · "}
          <button onClick={signOut} className="text-brand hover:underline">switch</button>
        </>
      }
      breadcrumb={<>Freelancer / Applications</>}
      actions={
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 font-display text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors hover:border-brand hover:text-brand"
        >
          Browse marketplace →
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total"     value={apps.length}             accent="sky" />
        <Stat label="Pending"   value={grouped.pending.length}  accent="amber" />
        <Stat label="Accepted"  value={grouped.accepted.length} accent="emerald" />
        <Stat label="Rejected"  value={grouped.rejected.length} accent="rose" />
      </div>

      {loading && (
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Loading…</p>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-rose-700">{error}</p>
        </div>
      )}

      {!loading && !error && apps.length === 0 && (
        <div className="mt-8 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white dark:bg-slate-900 shadow-md ring-1 ring-sky-200">
            <Inbox className="h-7 w-7 text-brand" strokeWidth={1.5} />
          </div>
          <h3 className="mt-5 font-display text-xl uppercase text-slate-900">No applications yet</h3>
          <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase leading-relaxed tracking-wide text-slate-600">
            Browse the public marketplace and apply to open jobs.
          </p>
          <Link
            href="/jobs"
            className="btn-gradient mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-display text-sm uppercase tracking-wider"
          >
            <Briefcase className="h-4 w-4" />
            Browse jobs
          </Link>
        </div>
      )}

      {!loading && !error && apps.length > 0 && (
        <section className="mt-8 space-y-3">
          {apps.map((a) => (
            <ApplicationRow key={a.id} app={a} />
          ))}
        </section>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent = "sky",
}: {
  label: string;
  value: string | number;
  accent?: "sky" | "amber" | "emerald" | "rose";
}) {
  const accentMap = {
    sky:     "from-sky-50 to-white text-sky-700 ring-sky-200",
    amber:   "from-amber-50 to-white text-amber-700 ring-amber-200",
    emerald: "from-emerald-50 to-white text-emerald-700 ring-emerald-200",
    rose:    "from-rose-50 to-white text-rose-700 ring-rose-200",
  };
  return (
    <div className={`relative rounded-2xl bg-gradient-to-br p-4 ring-1 shadow-sm ${accentMap[accent]}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  const statusStyle = {
    pending:   "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200",
    accepted:  "bg-emerald-100 text-emerald-800 ring-emerald-200",
    rejected:  "bg-rose-100 text-rose-800 ring-rose-200",
    withdrawn: "bg-amber-100 text-amber-800 ring-amber-200",
  }[app.status];

  return (
    <Link
      href={`/jobs/${app.order_id}`}
      className="group relative block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Job #{app.order_id}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1 ${statusStyle}`}>
              {app.status}
            </span>
          </div>
          {app.pitch && (
            <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-relaxed text-slate-700">{app.pitch}</p>
          )}
          {app.bid_amount_usdc !== null && app.bid_amount_usdc !== undefined && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Counter-bid: <span className="text-slate-900">${app.bid_amount_usdc}</span>
            </p>
          )}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Applied {new Date(app.created_at).toLocaleString()}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
      </div>
    </Link>
  );
}
