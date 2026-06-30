"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Clock } from "lucide-react";
import { listJobs } from "@/lib/api";
import type { Order } from "@/lib/orders";

const FIELD_EMOJI: Record<string, string> = {
  design: "🎨", dev: "⚙️", writing: "✍️", video: "🎬",
  marketing: "📣", research: "🔬", other: "📦",
};

/**
 * Slim preview of the latest 6 marketplace jobs, embedded in the landing page
 * so non-logged-in visitors immediately see real activity.
 */
export function LiveJobsPreview() {
  const [jobs, setJobs] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { jobs } = await listJobs({ limit: 6 });
        setJobs(jobs);
      } catch {
        // fail silently — landing should still render
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // If no jobs and not loading, fall back to a placeholder card encouraging post
  return (
    <section className="relative bg-ink py-20 sm:py-24">
      <div className="mx-auto max-w-landing px-6 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-signal">
              Live · marketplace
            </span>
            <h2 className="mt-1 font-display text-[32px] uppercase leading-tight tracking-tight sm:text-5xl">
              Open jobs right now
            </h2>
            <p className="mt-2 max-w-md font-mono text-xs uppercase tracking-wide text-cream/60">
              Real escrow orders posted by clients. Apply with one click. USDC released the second you deliver.
            </p>
          </div>
          <Link
            href="/jobs"
            className="liquid-glass relative inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-display text-sm uppercase tracking-wider text-cream transition-colors hover:bg-white/10"
          >
            See all jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="liquid-glass h-44 rounded-2xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="liquid-glass mt-10 rounded-2xl p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-signal/10 ring-1 ring-signal/30">
              <Briefcase className="h-5 w-5 text-signal" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display text-lg uppercase text-cream">
              Be the first to post
            </p>
            <p className="mt-1 max-w-md mx-auto font-mono text-[11px] uppercase tracking-wide text-cream/60">
              No public jobs in the feed yet. Post yours and freelancers can apply within minutes.
            </p>
            <Link
              href="/client"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-display text-xs uppercase tracking-wider text-ink"
            >
              + Post a job
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="liquid-glass group relative block rounded-2xl p-5 transition-all hover:bg-white/[0.06] hover:ring-1 hover:ring-signal/30"
              >
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cream/60">
                  <span>{FIELD_EMOJI[j.field] ?? "📦"}</span> {j.field}
                </span>

                <h3 className="mt-3 line-clamp-2 font-display text-base uppercase leading-tight text-cream">
                  {j.title ?? j.brief.slice(0, 60)}
                </h3>
                <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-relaxed text-cream/50">
                  {j.brief}
                </p>

                <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-3">
                  <span className="font-display text-lg text-signal">
                    ${j.amount_usdc.toLocaleString()}
                    <span className="ml-1 font-mono text-[9px] uppercase tracking-widest text-cream/40">USDC</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                    <Clock className="h-3 w-3" />
                    {j.deadline ? new Date(j.deadline).toLocaleDateString() : "Open"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
