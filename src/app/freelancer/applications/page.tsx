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
      setLoading(true);
      setError(null);
      try {
        const { applications } = await listMyApplications(email);
        setApps(applications);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load applications");
      } finally {
        setLoading(false);
      }
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
          Signed in as <span className="text-cream/80">{email}</span>
          {" · "}
          <button onClick={signOut} className="text-signal hover:underline">switch</button>
        </>
      }
      breadcrumb={<>Freelancer / Applications</>}
      actions={
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 font-display text-xs uppercase tracking-wider text-cream/80 transition-colors hover:bg-white/[0.08] hover:text-signal"
        >
          Browse marketplace →
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total"     value={apps.length} />
        <Stat label="Pending"   value={grouped.pending.length}  accent="amber" />
        <Stat label="Accepted"  value={grouped.accepted.length} accent="signal" />
        <Stat label="Rejected"  value={grouped.rejected.length} />
      </div>

      {loading && (
        <div className="liquid-glass mt-8 rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-cream/50">Loading…</p>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-rose-300">{error}</p>
        </div>
      )}

      {!loading && !error && apps.length === 0 && (
        <div className="liquid-glass relative mt-8 rounded-3xl p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-signal/10 ring-1 ring-signal/30">
            <Inbox className="h-7 w-7 text-signal" strokeWidth={1.5} />
          </div>
          <h3 className="mt-5 font-display text-xl uppercase text-cream">No applications yet</h3>
          <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase leading-relaxed tracking-wide text-cream/60">
            Browse the public marketplace and apply to open jobs.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.02]"
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
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "signal" | "amber";
}) {
  const accentColor =
    accent === "signal" ? "text-signal" :
    accent === "amber"  ? "text-amber-300" :
                          "text-cream";
  return (
    <div className="liquid-glass relative rounded-2xl p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accentColor}`}>{value}</p>
    </div>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  const statusStyle = {
    pending:   "bg-white/[0.05] text-cream/70 ring-white/10",
    accepted:  "bg-signal/15 text-signal ring-signal/40",
    rejected:  "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    withdrawn: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  }[app.status];

  return (
    <Link
      href={`/jobs/${app.order_id}`}
      className="liquid-glass group relative block rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:ring-1 hover:ring-signal/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
              Job #{app.order_id}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1 ${statusStyle}`}>
              {app.status}
            </span>
          </div>
          {app.pitch && (
            <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-relaxed text-cream/70">
              {app.pitch}
            </p>
          )}
          {app.bid_amount_usdc !== null && app.bid_amount_usdc !== undefined && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-cream/40">
              Counter-bid: <span className="text-cream/80">${app.bid_amount_usdc}</span>
            </p>
          )}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cream/30">
            Applied {new Date(app.created_at).toLocaleString()}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-cream/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal" />
      </div>
    </Link>
  );
}
