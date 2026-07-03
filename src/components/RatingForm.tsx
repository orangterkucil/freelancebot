"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { submitRating } from "@/lib/api";

/**
 * Post-release rating form. Shown on /orders/[id] when status is "released"
 * and the viewer is a party. Each side can rate the other once.
 */
export function RatingForm({
  orderId,
  rateeEmail,
  rateeLabel,
  onSubmitted,
}: {
  orderId: number;
  rateeEmail: string;
  rateeLabel: string;
  onSubmitted: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) {
      setError("Pick 1–5 stars");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitRating({
        order_id: orderId,
        ratee_email: rateeEmail,
        stars,
        comment: comment.trim() || undefined,
      });
      onSubmitted();
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit rating");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-rose-950/40 p-5 shadow-sm"
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-amber-700">
        Rate this counterparty
      </p>
      <p className="mt-1 font-display text-base uppercase text-slate-900">
        How was working with {rateeLabel}?
      </p>

      {/* Star picker */}
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = i + 1;
          const active = (hover || stars) >= v;
          return (
            <button
              key={v}
              type="button"
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(v)}
              aria-label={`${v} star${v === 1 ? "" : "s"}`}
              className="grid h-9 w-9 place-items-center rounded-md transition-transform hover:scale-110"
            >
              <Star
                className={active ? "text-amber-400" : "text-slate-300"}
                fill={active ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
        <span className="ml-2 font-mono text-xs tabular-nums text-slate-600">
          {stars > 0 ? `${stars}/5` : "—"}
        </span>
      </div>

      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment (visible publicly on their profile)"
        className="mt-4 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 outline-none transition-colors focus:border-brand"
      />

      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || stars < 1}
        className="btn-gradient mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs uppercase tracking-wider"
      >
        <Send className="h-3.5 w-3.5" />
        {busy ? "Submitting…" : "Submit rating"}
      </button>
    </form>
  );
}
