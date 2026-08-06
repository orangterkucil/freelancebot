"use client";

import { useEffect, useState } from "react";
import { Check, X, Inbox, Coins, Sparkles } from "lucide-react";
import { listApplicationsForOrder, decideApplication, rankApplicants } from "@/lib/api";
import { UserBadge } from "./UserBadge";
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

  // Agent ranking — advisory; the client still accepts manually.
  const [ranking, setRanking] = useState<{
    recommendedId: number | null;
    reasoning: string;
    notes: Record<number, string>;
  } | null>(null);
  const [rankBusy, setRankBusy] = useState(false);

  const runRanking = async () => {
    setRankBusy(true);
    try {
      setRanking(await rankApplicants(orderId));
    } catch {
      /* advisory only — never block the client on a failed ranking */
    } finally {
      setRankBusy(false);
    }
  };

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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Loading applications…</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

      {/* Agent picks a candidate — real hiring judgment, still the client's call */}
      {apps.some((a) => a.status === "pending") && (
        <div className="mt-3">
          <button
            onClick={runRanking}
            disabled={rankBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-violet-800 transition-colors hover:border-violet-500 disabled:opacity-40"
          >
            <Sparkles className="h-3 w-3" />
            {rankBusy ? "Agent comparing…" : "Ask the agent who fits this brief"}
          </button>

          {ranking && ranking.reasoning && (
            <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-violet-700">
                Agent recommendation
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-700">
                {ranking.reasoning}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {apps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            busy={busyId === app.id}
            disabled={apps.some((a) => a.status === "accepted")}
            recommended={ranking?.recommendedId === app.id}
            agentNote={ranking?.notes?.[app.id]}
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
  recommended,
  agentNote,
  onAccept,
  onReject,
}: {
  app: Application;
  busy: boolean;
  disabled: boolean;
  recommended?: boolean;
  agentNote?: string;
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
          : recommended ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
          : "border-slate-200 bg-slate-50")
      }
    >
      {recommended && (
        <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white">
          <Sparkles className="h-2.5 w-2.5" /> Agent&apos;s pick
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Applicant identity + portable trust score (stars/count, or "new") */}
          <UserBadge email={app.freelancer_email} raw />
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

      {agentNote && (
        <p className="mt-2 border-l-2 border-violet-300 pl-2 font-mono text-[10px] italic leading-relaxed text-violet-800">
          Agent: {agentNote}
        </p>
      )}

      {app.bid_amount_usdc !== null && app.bid_amount_usdc !== undefined && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-600">
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
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 font-display text-[11px] uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
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
    pending:   "bg-slate-100 text-slate-700 ring-slate-200",
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
