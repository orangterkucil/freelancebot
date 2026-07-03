"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Clock, Sparkles } from "lucide-react";
import { listJobs } from "@/lib/api";
import type { Order } from "@/lib/orders";

const FIELD_EMOJI: Record<string, string> = {
  design: "🎨", dev: "⚙️", writing: "✍️", video: "🎬",
  marketing: "📣", research: "🔬", other: "📦",
};

export function LiveJobsPreview() {
  const [jobs, setJobs] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { jobs } = await listJobs({ limit: 6 });
        setJobs(jobs);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-white via-sky-50/40 to-white py-20 sm:py-24">
      <div className="mx-auto max-w-landing px-6 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live · marketplace
            </span>
            <h2 className="mt-3 font-display text-[32px] uppercase leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Open jobs right now
            </h2>
            <p className="mt-2 max-w-md font-mono text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Real escrow orders posted by clients. Apply with one click. USDC released the second you deliver.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 font-display text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-md"
          >
            See all jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-sky-200 dark:border-sky-800/50 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white dark:bg-slate-900 shadow-md ring-1 ring-sky-200">
              <Sparkles className="h-5 w-5 text-brand" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display text-lg uppercase text-slate-900 dark:text-slate-100">
              Be the first to post
            </p>
            <p className="mt-1 max-w-md mx-auto font-mono text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-400">
              No public jobs in the feed yet. Post yours and freelancers can apply within minutes.
            </p>
            <Link
              href="/client"
              className="btn-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs uppercase tracking-wider"
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
                className="group relative block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
              >
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  <span>{FIELD_EMOJI[j.field] ?? "📦"}</span> {j.field}
                </span>

                <h3 className="mt-3 line-clamp-2 font-display text-base uppercase leading-tight text-slate-900 dark:text-slate-100">
                  {j.title ?? j.brief.slice(0, 60)}
                </h3>
                <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {j.brief}
                </p>

                <div className="mt-4 flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="font-display text-lg text-brand">
                    ${j.amount_usdc.toLocaleString()}
                    <span className="ml-1 font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">USDC</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
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
