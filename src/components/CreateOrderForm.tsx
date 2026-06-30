"use client";

import { useState } from "react";
import { createOrder } from "@/lib/api";
import { Sparkles } from "lucide-react";

export function CreateOrderForm({
  clientEmail,
  onCreated,
}: {
  clientEmail: string;
  onCreated: (id: number) => void;
}) {
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [brief, setBrief] = useState("");
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
        client_email: clientEmail,
        freelancer_email: freelancerEmail.trim().toLowerCase(),
        brief: brief.trim(),
        amount_usdc: Number(amount),
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      onCreated(res.order.id);
      setFreelancerEmail("");
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
        Hire a freelancer
      </h2>

      <div className="space-y-4">
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

        <Field label="Brief" hint="What needs to be delivered — be specific for better agent verification">
          <textarea
            required
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Brand logo + 3 variations, deliver via Figma link"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount" hint="USDC, on Arc Testnet">
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
        {busy ? "Creating…" : "Create escrow order"}
      </button>

      <p className="border-t border-white/5 pt-3 font-mono text-[10px] uppercase tracking-widest text-cream/40">
        Step 1 of 3 · Next: fund the escrow on Arc
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
