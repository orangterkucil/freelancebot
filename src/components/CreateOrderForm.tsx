"use client";

import { useState } from "react";
import { createOrder } from "@/lib/api";

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
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">New order</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700">Freelancer email</label>
        <input
          type="email"
          required
          value={freelancerEmail}
          onChange={(e) => setFreelancerEmail(e.target.value)}
          placeholder="freelancer@example.com"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Brief</label>
        <textarea
          required
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Brand logo + 3 variations, deliver via Figma link"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Amount (USDC)</label>
          <input
            type="number"
            required
            min={1}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="300"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create order"}
      </button>
    </form>
  );
}
