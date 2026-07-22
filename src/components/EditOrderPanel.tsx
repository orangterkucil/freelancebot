"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { editOrder } from "@/lib/api";
import type { Order } from "@/lib/orders";

/**
 * Edit a DRAFT order in place — so a client can fix a mistake (wrong title,
 * brief, amount, deadline) instead of creating a brand-new order. Only shown for
 * the client on a draft; the server also enforces both conditions.
 */
export function EditOrderPanel({ order, onSaved }: { order: Order; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(order.title ?? "");
  const [brief, setBrief] = useState(order.brief);
  const [amount, setAmount] = useState<number | "">(order.amount_usdc);
  const [deadline, setDeadline] = useState(order.deadline ? order.deadline.split("T")[0] : "");
  const [isPublic, setIsPublic] = useState(order.is_public);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDeadline = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const save = async () => {
    setError(null);
    if (deadline && new Date(deadline).getTime() <= Date.now()) {
      setError("Deadline must be a future date — pick tomorrow or later.");
      return;
    }
    setBusy(true);
    try {
      await editOrder(order.id, {
        title: title.trim() || null,
        brief: brief.trim(),
        amount_usdc: amount === "" ? 0 : Number(amount),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        is_public: isPublic,
      });
      setOpen(false);
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-display text-xs uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-brand hover:text-brand"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit order
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs uppercase tracking-wider text-slate-900">Edit order</p>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputClass} />
      </Field>
      <Field label="Brief">
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (USDC)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Deadline">
          <input type="date" min={minDeadline} value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2 pt-1">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-brand" />
        <span className="font-mono text-[11px] text-slate-700">List on the public marketplace</span>
      </label>

      {error && <p className="font-mono text-[11px] text-rose-600">{error}</p>}

      <button
        onClick={save}
        disabled={busy || !brief.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-display text-xs uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        <Save className="h-3.5 w-3.5" />
        {busy ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none transition-colors focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</span>
      {children}
    </label>
  );
}
