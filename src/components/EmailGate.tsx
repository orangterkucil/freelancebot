"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "./AppHeader";
import { ArrowRight } from "lucide-react";

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
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader showWallet={false} />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
            Loading…
          </p>
        </main>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-space">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/60" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/40" />

        <div className="relative">
          <AppHeader showWallet={false} />

          <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-6">
            <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-brand">
                Step 01 · Identity
              </p>
              <h1 className="font-display text-3xl uppercase leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {label}
              </h1>
              <p className="mt-3 font-mono text-xs leading-relaxed text-slate-600">
                Enter the email you want to use for this session. Demo mode — no verification. Real auth (magic-link + embedded wallet) lands in MVP 2.
              </p>

              <form
                className="mt-8 space-y-4"
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
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand"
                />
                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <p className="mt-6 border-t border-slate-200 pt-4 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                · USDC escrow on Arc
                <br />· AI agent verifies deliverables
                <br />· Sub-second settlement
              </p>
            </div>
          </main>
        </div>
      </div>
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
