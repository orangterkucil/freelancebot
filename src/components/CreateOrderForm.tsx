"use client";

import { useState } from "react";
import { Sparkles, Globe, Lock } from "lucide-react";
import { createOrder } from "@/lib/api";
import { FIELDS, type Field } from "@/lib/orders";

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
}: {
  clientEmail: string;
  onCreated: (id: number) => void;
}) {
  const [mode, setMode] = useState<"public" | "private">("public");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [field, setField] = useState<Field>("design");
  const [amount, setAmount] = useState<number | "">("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createOrder({
        client_email:     clientEmail,
        freelancer_email: mode === "public" ? clientEmail : freelancerEmail.trim().toLowerCase(),
        title:            title.trim() || null,
        field,
        is_public:        mode === "public",
        brief:            brief.trim(),
        amount_usdc:      Number(amount),
        deadline:         deadline ? new Date(deadline).toISOString() : null,
      });
      onCreated(res.order.id);
      setFreelancerEmail("");
      setTitle("");
      setBrief("");
      setAmount("");
      setDeadline("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="liquid-glass relative space-y-5 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-signal" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-signal">
          New escrow
        </span>
      </div>

      <h2 className="font-display text-2xl uppercase text-cream">
        Post a job
      </h2>

      {/* Public / private toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => setMode("public")}
          className={
            "flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors " +
            (mode === "public"
              ? "bg-signal text-ink"
              : "text-cream/60 hover:text-cream")
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
            (mode === "private"
              ? "bg-signal text-ink"
              : "text-cream/60 hover:text-cream")
          }
        >
          <Lock className="h-3.5 w-3.5" />
          Direct (private)
        </button>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-cream/40">
        {mode === "public"
          ? "Listed on /jobs for any freelancer to apply. You pick one applicant, then escrow flow starts."
          : "Sent directly to a freelancer you already know. Not listed publicly."}
      </p>

      <div className="space-y-4">
        {/* Field selector (public only) */}
        {mode === "public" && (
          <Field label="Category" hint="Helps freelancers find your job">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setField(f)}
                  className={
                    "rounded-lg px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors " +
                    (field === f
                      ? "bg-signal text-ink"
                      : "border border-white/10 bg-white/[0.04] text-cream/70 hover:bg-white/[0.08]")
                  }
                >
                  {FIELD_LABELS[f]}
                </button>
              ))}
            </div>
          </Field>
        )}

        {mode === "public" && (
          <Field label="Title" hint="Short headline — appears in feed">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brand logo + variations"
              className={inputClass}
              maxLength={80}
            />
          </Field>
        )}

        {mode === "private" && (
          <Field label="Freelancer email" hint="Their wallet will be auto-derived from this email">
            <input
              type="email"
              required
              value={freelancerEmail}
              onChange={(e) => setFreelancerEmail(e.target.value)}
              placeholder="freelancer@example.com"
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Brief" hint="What needs to be delivered — be specific for better agent verification">
          <textarea
            required
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Need a logo design with 3 color variations, delivered as SVG + PNG via Figma link. Modern style, fintech vibe..."
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount" hint="USDC on Arc Testnet">
            <div className="relative">
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="300"
                className={inputClass + " pr-16"}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                USDC
              </span>
            </div>
          </Field>
          <Field label="Deadline" hint="Refund opens 7 days after">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass + " [color-scheme:dark]"}
            />
          </Field>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-signal px-4 py-3 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        {busy ? "Creating…" : mode === "public" ? "Post to marketplace" : "Send direct order"}
      </button>

      <p className="border-t border-white/5 pt-3 font-mono text-[10px] uppercase tracking-widest text-cream/40">
        Step 1 of 3 · {mode === "public" ? "Wait for applications, then pick" : "Next: fund the escrow"}
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-signal/60 focus:bg-white/[0.08]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-cream/60">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <span className="mt-1 block font-mono text-[10px] tracking-wide text-cream/30">
          {hint}
        </span>
      )}
    </label>
  );
}
