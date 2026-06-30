"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getOrder } from "@/lib/api";
import { applyToJob } from "@/lib/api";
import type { Order } from "@/lib/orders";

const FIELD_EMOJI: Record<string, string> = {
  design: "🎨", dev: "⚙️", writing: "✍️", video: "🎬",
  marketing: "📣", research: "🔬", other: "📦",
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = Number(params.id);

  const [job, setJob] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply form state
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [pitch, setPitch] = useState("");
  const [bid, setBid] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { order } = await getOrder(orderId);
        setJob(order);
        // Prefill freelancer email from localStorage if present
        try {
          const e = window.localStorage.getItem("fb_freelancer_email");
          if (e) setFreelancerEmail(e);
        } catch {}
      } catch (e: any) {
        setError(e?.message ?? "Failed to load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <AppShell title="Loading…" subtitle="Fetching job">
        <div className="liquid-glass rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-cream/50">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !job) {
    return (
      <AppShell title="Job not found" subtitle={error ?? "This job does not exist"}>
        <Link href="/jobs" className="liquid-glass inline-flex rounded-xl px-4 py-2 font-display text-xs uppercase tracking-wider text-cream hover:bg-white/10">
          ← back to marketplace
        </Link>
      </AppShell>
    );
  }

  const isOpen = job.is_public && job.status === "draft";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await applyToJob({
        order_id: job.id,
        freelancer_email: freelancerEmail.trim().toLowerCase(),
        pitch: pitch.trim() || undefined,
        bid_amount_usdc: bid === "" ? undefined : Number(bid),
      });
      try { window.localStorage.setItem("fb_freelancer_email", freelancerEmail.trim().toLowerCase()); } catch {}
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title={job.title ?? job.brief.slice(0, 60)}
      subtitle={
        <span className="inline-flex items-center gap-2">
          <span>{FIELD_EMOJI[job.field] ?? "📦"}</span>
          <span className="capitalize">{job.field}</span>
          <span>·</span>
          <span>${job.amount_usdc.toLocaleString()} USDC</span>
          {job.deadline && (
            <>
              <span>·</span>
              <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
            </>
          )}
        </span>
      }
      breadcrumb={<>Marketplace / Job #{job.id}</>}
    >
      <Link href="/jobs" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/40 hover:text-signal">
        <ArrowLeft className="h-3 w-3" />
        Back to marketplace
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* LEFT — job description */}
        <div className="liquid-glass rounded-2xl p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
            Brief
          </p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-cream/90">
            {job.brief}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
            <Field label="Budget">
              <span className="font-display text-lg text-signal">
                ${job.amount_usdc.toLocaleString()}
              </span>
            </Field>
            <Field label="Deadline">
              {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Flexible"}
            </Field>
            <Field label="Field" className="capitalize">{job.field}</Field>
          </div>

          <div className="mt-4 border-t border-white/5 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
              Posted by
            </p>
            <p className="mt-1 font-mono text-xs text-cream/80">
              {job.client_email}
            </p>
          </div>
        </div>

        {/* RIGHT — apply card */}
        <div className="liquid-glass rounded-2xl p-6">
          {!isOpen ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber-300">
                · Closed
              </p>
              <p className="mt-2 font-display text-lg uppercase text-cream">
                This job is no longer open
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-cream/60">
                Either the client picked a freelancer or withdrew the listing.
                Status: <span className="text-cream/80">{job.status}</span>.
              </p>
              <Link
                href="/jobs"
                className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 font-display text-xs uppercase tracking-wider text-cream hover:bg-white/[0.08]"
              >
                Browse other jobs →
              </Link>
            </div>
          ) : submitted ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
                ✓ Applied
              </p>
              <p className="mt-2 font-display text-lg uppercase text-cream">
                Application sent
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-cream/60">
                The client will review and pick. You can see your applications
                in the freelancer dashboard.
              </p>
              <Link
                href="/freelancer"
                className="mt-4 inline-flex rounded-xl bg-signal px-4 py-2.5 font-display text-xs uppercase tracking-wider text-ink"
              >
                Go to freelancer dashboard →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
                  Apply to this job
                </p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-cream/50">
                  Quick pitch + bid. Client picks one applicant, then escrow flow starts.
                </p>
              </div>

              <FormField label="Your email">
                <input
                  type="email"
                  required
                  value={freelancerEmail}
                  onChange={(e) => setFreelancerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Pitch (optional)" hint="Why you're a good fit. Keep it tight.">
                <textarea
                  rows={4}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="I've shipped 12 similar projects in 2026..."
                  className={inputClass}
                />
              </FormField>

              <FormField label="Counter-bid (optional)" hint={`Leave blank to accept budget of $${job.amount_usdc} USDC`}>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={bid}
                    onChange={(e) => setBid(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={String(job.amount_usdc)}
                    className={inputClass + " pr-16"}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                    USDC
                  </span>
                </div>
              </FormField>

              {submitError && (
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !freelancerEmail.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-xs text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08]";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">{label}</p>
      <p className={"mt-1 font-mono text-xs text-cream " + className}>{children}</p>
    </div>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-cream/60">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block font-mono text-[10px] tracking-wide text-cream/30">{hint}</span>}
    </label>
  );
}
