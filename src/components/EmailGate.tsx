"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "./AppHeader";
import { ArrowRight, MailCheck, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * EmailGate — real auth via Supabase magic link (v0.12.0).
 *
 * Flow:
 *  1. User enters email → we call supabase.auth.signInWithOtp({ email }).
 *  2. Supabase sends a magic link. UI switches to "check your inbox".
 *  3. User clicks link → lands on /auth/callback, which detects the session
 *     and stores the email under `storageKey` for backward compat with the
 *     rest of the app (which reads localStorage for the actor identity).
 *  4. Next mount: the gate finds the email in localStorage and lets them in.
 *
 * Demo escape hatch: `?demo=1` in the URL keeps the old email-only flow so
 * hackathon judges without inbox access can still walk through the app.
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
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v) setEmail(v);
    } catch {}
    // Detect ?demo=1 flag or existing Supabase session
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1") setDemoMode(true);
      // If Supabase session exists (from magic-link callback), sync email
      supabaseBrowser().auth.getSession().then(({ data }) => {
        const authedEmail = data.session?.user?.email?.toLowerCase();
        if (authedEmail) {
          try { window.localStorage.setItem(storageKey, authedEmail); } catch {}
          setEmail(authedEmail);
        }
      }).catch(() => {});
    }
    setReady(true);
  }, [storageKey]);

  async function sendMagicLink() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed.includes("@")) return;
    setState("sending");
    setErrorMsg(null);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}&role=${encodeURIComponent(storageKey)}`,
        },
      });
      if (error) throw error;
      setState("sent");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to send magic link. Try demo mode below.");
      setState("error");
    }
  }

  function continueDemo() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed.includes("@")) return;
    try { window.localStorage.setItem(storageKey, trimmed); } catch {}
    setEmail(trimmed);
  }

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

              {state !== "sent" && (
                <>
                  <p className="mt-3 font-mono text-xs leading-relaxed text-slate-600">
                    {demoMode
                      ? "Demo mode — no verification, no inbox needed."
                      : "We'll email you a magic link. No password."}
                  </p>

                  <form
                    className="mt-8 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (demoMode) continueDemo();
                      else sendMagicLink();
                    }}
                  >
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={state === "sending"}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={state === "sending"}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                    >
                      {state === "sending" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending link…
                        </>
                      ) : (
                        <>
                          {demoMode ? "Continue" : "Send magic link"}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  {errorMsg && (
                    <p className="mt-3 font-mono text-[11px] text-rose-600">
                      {errorMsg}
                    </p>
                  )}

                  {!demoMode && (
                    <button
                      type="button"
                      onClick={() => setDemoMode(true)}
                      className="mt-4 w-full text-center font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-brand"
                    >
                      Or use demo mode (no email) →
                    </button>
                  )}
                </>
              )}

              {state === "sent" && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex items-start gap-3">
                    <MailCheck className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-display text-sm uppercase tracking-wider text-emerald-800">
                        Check your inbox
                      </p>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-emerald-800">
                        We sent a magic link to <strong className="font-semibold">{input.trim().toLowerCase()}</strong>. Click it to sign in — the link expires in 1 hour. Check spam if you don&apos;t see it.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setState("idle")}
                    className="mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-brand"
                  >
                    ← Use a different email
                  </button>
                </div>
              )}

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
    // Also sign out of Supabase session so magic-link flow starts fresh
    supabaseBrowser().auth.signOut().catch(() => {});
    setEmail(null);
    setInput("");
    setState("idle");
  };

  return <>{children(email, signOut)}</>;
}
