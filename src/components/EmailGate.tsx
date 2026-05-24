"use client";

import { useEffect, useState } from "react";

/**
 * Simple email-based "auth" for the MVP. Stores the email in localStorage
 * and lets the user switch identity. This is intentionally not real auth —
 * the demo is for showing the agentic + stablecoin flow, not credentials.
 *
 * Real auth would use Circle Wallets (week 6 stretch).
 */
export function EmailGate({
  storageKey,
  label,
  children,
}: {
  storageKey: string;
  label: string;
  children: (email: string, signOut: () => void) => React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v) setEmail(v);
    } catch {}
    setReady(true);
  }, [storageKey]);

  if (!ready) {
    return <main className="mx-auto max-w-3xl px-6 py-16 text-slate-400">Loading…</main>;
  }

  if (!email) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the email you want to use for this session. This is a demo, so we
          don&apos;t verify — just type the one you used elsewhere in the app.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = input.trim().toLowerCase();
            if (!trimmed.includes("@")) return;
            try {
              window.localStorage.setItem(storageKey, trimmed);
            } catch {}
            setEmail(trimmed);
          }}
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white hover:bg-brand-dark"
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  const signOut = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
    setEmail(null);
    setInput("");
  };

  return <>{children(email, signOut)}</>;
}
