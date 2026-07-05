"use client";

import { useEffect, useState } from "react";
import { Sparkles, Globe, Lock, Twitter, Github, Linkedin } from "lucide-react";
import { createOrder } from "@/lib/api";
import { FIELDS, type Field, type Attachment, type ClientLinks } from "@/lib/orders";
import { FileDropzone } from "./FileDropzone";

const FIELD_LABELS: Record<Field, string> = {
  design:    "🎨 Design",
  dev:       "⚙️ Dev",
  writing:   "✍️ Writing",
  video:     "🎬 Video",
  marketing: "📣 Marketing",
  research:  "🔬 Research",
  other:     "📦 Other",
};

export function CreateOrderForm({
  clientEmail,
  onCreated,
  posterRole = "client",
}: {
  clientEmail: string;
  onCreated: (id: number) => void;
  posterRole?: "client" | "freelancer";  // v0.13.0 — freelancer can also post
}) {
  const isFreelancerPosting = posterRole === "freelancer";
  const [mode, setMode] = useState<"public" | "private">("public");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [field, setField] = useState<Field>("design");
  const [amount, setAmount] = useState<number | "">("");
  const [deadline, setDeadline] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social links (pre-filled from /settings localStorage if available)
  const [showLinks, setShowLinks] = useState(false);
  const [xHandle, setXHandle]   = useState("");
  const [github,  setGithub]    = useState("");
  const [website, setWebsite]   = useState("");
  const [linkedin, setLinkedin] = useState("");

  useEffect(() => {
    try {
      const x = window.localStorage.getItem("fb_profile_x") ?? "";
      const g = window.localStorage.getItem("fb_profile_github") ?? "";
      const w = window.localStorage.getItem("fb_profile_website") ?? "";
      const l = window.localStorage.getItem("fb_profile_linkedin") ?? "";
      setXHandle(x); setGithub(g); setWebsite(w); setLinkedin(l);
      if (x || g || w || l) setShowLinks(true);
    } catch {}
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const client_links: ClientLinks = {};
      if (xHandle.trim())  client_links.x        = xHandle.trim();
      if (github.trim())   client_links.github   = github.trim();
      if (website.trim())  client_links.website  = website.trim();
      if (linkedin.trim()) client_links.linkedin = linkedin.trim();

      const res = await createOrder({
        client_email:     clientEmail,
        freelancer_email: mode === "public" ? clientEmail : freelancerEmail.trim().toLowerCase(),
        title:            title.trim() || null,
        field,
        is_public:        mode === "public",
        attachments,
        client_links,
        brief:            brief.trim(),
        amount_usdc:      Number(amount),
        deadline:         deadline ? new Date(deadline).toISOString() : null,
        poster_role:      posterRole,
      });
      onCreated(res.order.id);
      setFreelancerEmail("");
      setTitle("");
      setBrief("");
      setAmount("");
      setDeadline("");
      setAttachments([]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-brand">
          {isFreelancerPosting ? "New service listing" : "New escrow"}
        </span>
      </div>

      <h2 className="font-display text-2xl uppercase text-slate-900">Post a job</h2>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode("public")}
          className={
            "flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors " +
            (mode === "public" ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:text-slate-900")
          }
        >
          <Globe className="h-3.5 w-3.5" />
          Public marketplace
        </button>
        <button
          type="button"
          onClick={() => setMode("private")}
          className={
            "flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors " +
            (mode === "private" ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:text-slate-900")
          }
        >
          <Lock className="h-3.5 w-3.5" />
          Direct (private)
        </button>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-slate-500">
        {mode === "public"
          ? "Listed on /jobs for any freelancer to apply. You pick one applicant, then escrow flow starts."
          : "Sent directly to a freelancer you already know. Not listed publicly."}
      </p>

      <div className="space-y-4">
        {mode === "public" && (
          <FormField label="Category" hint="Helps freelancers find your job">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setField(f)}
                  className={
                    "rounded-lg px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors " +
                    (field === f
                      ? "bg-brand text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand")
                  }
                >
                  {FIELD_LABELS[f]}
                </button>
              ))}
            </div>
          </FormField>
        )}

        {mode === "public" && (
          <FormField label="Title" hint="Short headline — appears in feed">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brand logo + variations"
              className={inputClass}
              maxLength={80}
            />
          </FormField>
        )}

        {mode === "private" && (
          <FormField label="Freelancer email">
            <input
              type="email"
              required
              value={freelancerEmail}
              onChange={(e) => setFreelancerEmail(e.target.value)}
              placeholder="freelancer@example.com"
              className={inputClass}
            />
          </FormField>
        )}

        <FormField label="Brief" hint="What needs to be delivered — be specific for better agent verification">
          <textarea
            required
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Need a logo design with 3 color variations, delivered as SVG + PNG via Figma link. Modern style, fintech vibe..."
            className={inputClass}
          />
        </FormField>

        <FormField label="Attachments (optional)" hint={mode === "public" ? "Visible to anyone in the marketplace." : "Only visible to you and the freelancer."}>
          <FileDropzone value={attachments} onChange={setAttachments} uploadedBy={clientEmail} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" hint="USDC on Arc Testnet · 0 = pro-bono">
            <div className="relative">
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="300"
                className={inputClass + " pr-16"}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-slate-400">USDC</span>
            </div>
          </FormField>
          <FormField label="Deadline" hint="Refund opens 7 days after">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </FormField>
        </div>

        {/* Social links — collapsible "shill" section */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <button
            type="button"
            onClick={() => setShowLinks((s) => !s)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="font-display text-sm uppercase tracking-wider text-slate-900">
                Your credibility (optional)
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand">
              {showLinks ? "Hide" : "Add"}
            </span>
          </button>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-slate-500">
            Shill your X, GitHub, website. Freelancers see them and decide whether to apply.
          </p>

          {showLinks && (
            <div className="mt-4 space-y-3">
              <SocialField Icon={Twitter} label="X / Twitter" value={xHandle}  onChange={setXHandle}  placeholder="yourhandle" />
              <SocialField Icon={Github}  label="GitHub"      value={github}   onChange={setGithub}   placeholder="yourhandle" />
              <SocialField Icon={Globe}   label="Website"     value={website}  onChange={setWebsite}  placeholder="https://yourdomain.com" />
              <SocialField Icon={Linkedin} label="LinkedIn"   value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/you" />
              <p className="font-mono text-[10px] text-slate-500">
                Tip: set defaults in <a href="/settings" className="text-brand hover:underline">Settings</a> so they auto-fill next time.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-gradient w-full rounded-xl px-4 py-3 font-display text-sm uppercase tracking-wider"
      >
        {busy ? "Creating…" : mode === "public" ? "Post to marketplace" : "Send direct order"}
      </button>

      <p className="border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        Step 1 of 3 · {mode === "public" ? "Wait for applications, then pick" : "Next: fund the escrow"}
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand";

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block font-mono text-[10px] tracking-wide text-slate-400">{hint}</span>}
    </label>
  );
}

function SocialField({
  Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}
