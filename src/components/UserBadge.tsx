"use client";

import { useEffect, useState } from "react";
import { RatingStars } from "./RatingStars";
import { getRatingSummary } from "@/lib/api";

/**
 * Inline trust badge — shows email + average stars + rating count.
 * Used next to client/freelancer email anywhere we want a quick trust glance.
 */
export function UserBadge({
  email,
  className = "",
  hideEmail = false,
}: {
  email: string;
  className?: string;
  hideEmail?: boolean;
}) {
  const [summary, setSummary] = useState<{ count: number; average: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getRatingSummary(email);
        if (!cancelled) setSummary({ count: s.count, average: s.average });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [email]);

  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      {!hideEmail && (
        <span className="font-mono text-xs text-slate-700 truncate">{email}</span>
      )}
      {summary && summary.count > 0 ? (
        <span className="inline-flex items-center gap-1">
          <RatingStars value={summary.average} size={12} />
          <span className="font-mono text-[10px] tabular-nums text-slate-500">
            {summary.average.toFixed(1)}
            <span className="ml-0.5 text-slate-400">({summary.count})</span>
          </span>
        </span>
      ) : (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
          new
        </span>
      )}
    </span>
  );
}
