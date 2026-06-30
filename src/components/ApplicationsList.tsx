"use client";

import { useEffect, useState } from "react";
import { Check, X, Inbox, Coins } from "lucide-react";
import { listApplicationsForOrder, decideApplication } from "@/lib/api";
import type { Application } from "@/lib/orders";

/**
 * Applications panel — shown on /orders/[id] when viewer is the CLIENT
 * and order is public + has applications.
 *
 * Lets the client review applicants and pick one. Accepting an application:
 *   - assigns the applicant as the order's freelancer
 *   - flips the order to private (is_public = false)
 *   - returns to the normal escrow flow (fund -> deliver -> release)
 */
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
      if (status === "accepted") {
        onAccepted();
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="liquid-glass rounded-2xl p-5">
        <p className="font-mono text-xs uppercase tracking-wider text-cream/50">Loading applications…</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-cream/40" />
          <p className="font-display text-sm uppercase tracking-wider text-cream">
            No applications yet
          </p>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-cream/50">
          Your job is live in the marketplace. Freelancers will apply here — you&apos;ll see them in this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-2xl p-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-signal" />
          <p className="font-display text-sm uppercase tracking-wider text-cream">
            Applications
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
          {apps.length} applicant{apps.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">
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
        (isAccepted ? "border-signal/40 bg-signal/5"
          : isRejected ? "border-rose-400/20 bg-rose-500/5 opacity-60"
          : "border-white/10 bg-white/[0.02]")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-cream truncate">
            {app.freelancer_email}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-cream/40">
            {new Date(app.created_at).toLocaleString()}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>

      {app.pitch && (
        <p className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-cream/70">
          {app.pitch}
        </p>
      )}

      {app.bid_amount_usdc !== null && app.bid_amount_usdc !== undefined && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-cream/60">
          <Coins className="h-3 w-3 text-signal" />
          Counter-bid: <span className="text-cream/90">${app.bid_amount_usdc} USDC</span>
        </div>
      )}

      {isPending && !disabled && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onAccept}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-signal px-3 py-2 font-display text-[11px] uppercase tracking-wider text-ink transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            <Check className="h-3.5 w-3.5" />
            {busy ? "…" : "Accept"}
          </button>
          <button
            onClick={onReject}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-display text-[11px] uppercase tracking-wider text-cream/70 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
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
    pending:   "bg-white/[0.05] text-cream/70 ring-white/10",
    accepted:  "bg-signal/15 text-signal ring-signal/40",
    rejected:  "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    withdrawn: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  } as const;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1 ${map[status]}`}>
      {status}
    </span>
  );
}
