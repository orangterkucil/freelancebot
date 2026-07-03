"use client";

import { useEffect, useState } from "react";
import { Check, X, Inbox, Coins } from "lucide-react";
import { listApplicationsForOrder, decideApplication } from "@/lib/api";
import type { Application } from "@/lib/orders";

export function ApplicationsList({
  orderId,
  onAccepted,
}: {
  orderId: number;
  onAccepted: () => void;
}) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { applications } = await listApplicationsForOrder(orderId);
      setApps(applications);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const decide = async (app: Application, status: "accepted" | "rejected") => {
    setBusyId(app.id);
    setError(null);
    try {
      await decideApplication(app.id, {
        status,
        order_id: app.order_id,
        freelancer_email: app.freelancer_email,
      });
      if (status === "accepted") onAccepted();
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Loading applications…</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-slate-400" />
          <p className="font-display text-sm uppercase tracking-wider text-slate-900">No applications yet</p>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-500">
          Your job is live in the marketplace. Freelancers will apply here — you&apos;ll see them in this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-brand" />
          <p className="font-display text-sm uppercase tracking-wider text-slate-900">Applications</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          {apps.length} applicant{apps.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {apps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            busy={busyId === app.id}
            disabled={apps.some((a) => a.status === "accepted")}
            onAccept={() => decide(app, "accepted")}
            onReject={() => decide(app, "rejected")}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  busy,
  disabled,
  onAccept,
  onReject,
}: {
  app: Application;
  busy: boolean;
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const isPending  = app.status === "pending";
  const isAccepted = app.status === "accepted";
  const isRejected = app.status === "rejected";

  return (
    <div
      className={
        "rounded-xl border p-3 transition-colors " +
        (isAccepted ? "border-emerald-200 bg-emerald-50"
          : isRejected ? "border-rose-200 bg-rose-50 opacity-70"
          : "border-slate-200 dark:border-slate-800 bg-slate-50")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate">{app.freelancer_email}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {new Date(app.created_at).toLocaleString()}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>

      {app.pitch && (
        <p className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700">
          {app.pitch}
        </p>
      )}

      {app.bid_amount_usdc !== null && app.bid_amount_usdc !== undefined && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-600">
          <Coins className="h-3 w-3 text-brand" />
          Counter-bid: <span className="text-slate-900">${app.bid_amount_usdc} USDC</span>
        </div>
      )}

      {isPending && !disabled && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onAccept}
            disabled={busy}
            className="btn-gradient inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-display text-[11px] uppercase tracking-wider"
          >
            <Check className="h-3.5 w-3.5" />
            {busy ? "…" : "Accept"}
          </button>
          <button
            onClick={onReject}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-display text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-950 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Application["status"] }) {
  const map = {
    pending:   "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200",
    accepted:  "bg-emerald-100 text-emerald-800 ring-emerald-200",
    rejected:  "bg-rose-100 text-rose-800 ring-rose-200",
    withdrawn: "bg-amber-100 text-amber-800 ring-amber-200",
  } as const;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1 ${map[status]}`}>
      {status}
    </span>
  );
}
