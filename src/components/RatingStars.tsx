"use client";

import { Star } from "lucide-react";

/**
 * Display-only star rating. Use for showing aggregate score next to user email,
 * or read-only on a rating row.
 *
 * @param value 0..5 (decimal)
 * @param size  pixel size of each star, default 14
 */
export function RatingStars({
  value,
  size = 14,
  showNumber = false,
}: {
  value: number;
  size?: number;
  showNumber?: boolean;
}) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill =
          i < full ? "currentColor"
          : i === full && half ? "url(#half)"
          : "none";
        return (
          <Star
            key={i}
            width={size}
            height={size}
            strokeWidth={1.5}
            className={i < full ? "text-amber-400" : i === full && half ? "text-amber-400" : "text-slate-300"}
            fill={fill}
          />
        );
      })}
      {showNumber && (
        <span className="ml-1 font-mono text-[10px] tabular-nums text-slate-600 dark:text-slate-400">
          {v.toFixed(1)}
        </span>
      )}
    </span>
  );
}
