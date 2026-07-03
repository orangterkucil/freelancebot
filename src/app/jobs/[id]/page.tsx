"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AttachmentsList } from "@/components/AttachmentsList";
import { UserBadge } from "@/components/UserBadge";
import { getOrder, applyToJob } from "@/lib/api";
import type { Order } from "@/lib/orders";
import { Twitter, Github, Globe, Linkedin } from "lucide-react";

const FIELD_EMOJI: Record<string, string> = {
  design: "🎨", dev: "⚙️", writing: "✍️", video: "🎬",
  marketing: "📣", research: "🔬", other: "📦",
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [job, setJob] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [pitch, setPitch] = useState("");
  const [bid, setBid] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const { order } = await getOrder(orderId);
        setJob(order);
        try {
          const e = window.localStorage.getItem("fb_freelancer_email");
          if (e) setFreelancerEmail(e);
        } catch {}
      } catch (e: any) {
        setError(e?.message ?? "Failed to load job");
      } finally { setLoading(false); }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <AppShell title="Loading…" subtitle="Fetching job">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !job) {
    return (
      <AppShell title="Job not found" subtitle={error ?? "This job does not exist"}>
        <Link href="/jobs" className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 font-display text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:border-brand hover:text-brand">
          ← back to marketplace
        </Link>
      </AppShell>
    );
  }

  const isOpen = job.is_public && job.status === "draft";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setSubmitError(null);
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
    } finally { setSubmitting(false); }
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
          {job.deadline && (<><span>·</span><span>Due {new Date(job.deadline).toLocaleDateString()}</span></>)}
        </span>
      }
      breadcrumb={<>Marketplace / Job #{job.id}</>}
    >
      <Link href="/jobs" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-brand">
        <ArrowLeft className="h-3 w-3" />
        Back to marketplace
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Brief</p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
            {job.brief}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Field label="Budget">
              <span className="font-display text-lg text-brand">${job.amount_usdc.toLocaleString()}</span>
            </Field>
            <Field label="Deadline">
              {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Flexible"}
            </Field>
            <Field label="Field" className="capitalize">{job.field}</Field>
          </div>

          {job.attachments && job.attachments.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Attachments
              </p>
              <AttachmentsList
                attachments={job.attachments}
                isPublic={job.is_public}
                isViewerParty={false}
              />
            </div>
          )}

          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Posted by</p>
            <div className="mt-1">
              <UserBadge email={job.client_email} links={job.client_links} />
            </div>

            {job.client_links && Object.keys(job.client_links).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.client_links.x && (
                  <SocialChip Icon={Twitter} href={normalizeUrl("x", job.client_links.x)} label={`@${stripHandle(job.client_links.x)}`} />
                )}
                {job.client_links.github && (
                  <SocialChip Icon={Github} href={normalizeUrl("github", job.client_links.github)} label={stripHandle(job.client_links.github)} />
                )}
                {job.client_links.website && (
                  <SocialChip Icon={Globe} href={normalizeUrl("url", job.client_links.website)} label="Website" />
                )}
                {job.client_links.linkedin && (
                  <SocialChip Icon={Linkedin} href={normalizeUrl("url", job.client_links.linkedin)} label="LinkedIn" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 dark:border-sky-800/50 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-sky-950/40 dark:via-slate-900 dark:to-indigo-950/40 p-6 shadow-sm">
          {!isOpen ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber-700">· Closed</p>
              <p className="mt-2 font-display text-lg uppercase text-slate-900">This job is no longer open</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-600">
                Either the client picked a freelancer or withdrew the listing. Status: <span className="text-slate-700">{job.status}</span>.
              </p>
              <Link href="/jobs" className="mt-4 inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 font-display text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:border-brand hover:text-brand">
                Browse other jobs →
              </Link>
            </div>
          ) : submitted ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700">✓ Applied</p>
              <p className="mt-2 font-display text-lg uppercase text-slate-900">Application sent</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-600">
                The client will review and pick. You can see your applications in the freelancer dashboard.
              </p>
              <Link href="/freelancer/applications" className="btn-gradient mt-4 inline-flex rounded-xl px-4 py-2.5 font-display text-xs uppercase tracking-wider">
                See my applications →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-brand">Apply to this job</p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-slate-500">
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

              <FormField label="Counter-bid (optional)" hint={`Leave blank to accept $${job.amount_usdc} USDC`}>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={bid}
                    onChange={(e) => setBid(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={String(job.amount_usdc)}
                    className={inputClass + " pr-16"}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-slate-400">USDC</span>
                </div>
              </FormField>

              {submitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !freelancerEmail.trim()}
                className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-sm uppercase tracking-wider"
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
  "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 outline-none transition-colors focus:border-brand";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={"mt-1 font-mono text-xs text-slate-700 dark:text-slate-300 " + className}>{children}</p>
    </div>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block font-mono text-[10px] tracking-wide text-slate-400">{hint}</span>}
    </label>
  );
}

function SocialChip({
  Icon,
  href,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 font-mono text-[10px] text-slate-700 dark:text-slate-300 transition-colors hover:border-brand hover:text-brand"
    >
      <Icon className="h-3 w-3" />
      {label}
    </a>
  );
}

function stripHandle(s: string): string {
  return s.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com|github\.com)\//, "").replace(/^@/, "").replace(/\/$/, "");
}

function normalizeUrl(kind: "x" | "github" | "url", v: string): string {
  const trimmed = v.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (kind === "x")      return `https://x.com/${trimmed}`;
  if (kind === "github") return `https://github.com/${trimmed}`;
  return `https://${trimmed}`;
}
