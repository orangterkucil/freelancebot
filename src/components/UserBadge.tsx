"use client";

import { useEffect, useState } from "react";
import { RatingStars } from "./RatingStars";
import { getRatingSummary } from "@/lib/api";
import { displayName } from "@/lib/privacy";
import type { ClientLinks } from "@/lib/orders";

/**
 * Inline trust badge — shows label (masked email or handle) + stars + count.
 *
 * By default the label is privacy-safe: X handle if the user has one,
 * else `gh/user`, else a masked email (`a•••e@gmail.com`).
 *
 * Pass `raw` to render the full email (only appropriate when the viewer is
 * a party to the order — enforced upstream via `assertActorIsParty`).
 */
export function UserBadge({
  email,
  links,
  raw = false,
  className = "",
  hideLabel = false,
}: {
  email: string;
  links?: ClientLinks | null;
  raw?: boolean;
  className?: string;
  hideLabel?: boolean;
}) {
  const [summary, setSummary] = useState<{ count: number; average: number } | null>(null);
  const label = raw ? email : displayName(email, links);

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
      {!hideLabel && (
        <span className="font-mono text-xs text-slate-700 truncate">{label}</span>
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
