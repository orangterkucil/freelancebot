"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";

/**
 * Magic-link callback landing page.
 *
 * Supabase redirects the user here after they click the email link.
 * The URL contains hash tokens (#access_token=...&refresh_token=...). The
 * Supabase JS SDK auto-detects and stores the session — we just need to
 * wait for it to complete, then bounce the user to their intended page.
 *
 * Wrapped in Suspense because useSearchParams() requires it for static export.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell state="working" msg="Verifying…" />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [msg, setMsg] = useState<string>("Verifying your magic link…");

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        // Give the SDK a beat to consume the hash tokens
        await new Promise((r) => setTimeout(r, 400));
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const email = data.session?.user?.email?.toLowerCase();
        if (!email) throw new Error("No session found. The link may have expired.");

        // Sync into localStorage so the EmailGate finds it on the target page.
        const role = params?.get("role") ?? "fb_client_email";
        try { window.localStorage.setItem(role, email); } catch {}

        setState("ok");
        setMsg(`Signed in as ${email}. Redirecting…`);
        const next = params?.get("next") ?? "/client";
        setTimeout(() => router.push(next), 900);
      } catch (e: any) {
        setState("error");
        setMsg(e?.message ?? "Sign-in failed. Please try again.");
      }
    })();
  }, [router, params]);

  return <CallbackShell state={state} msg={msg} />;
}

function CallbackShell({ state, msg }: { state: "working" | "ok" | "error"; msg: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader showWallet={false} />
      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-6">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            {state === "working" && <Loader2 className="h-5 w-5 animate-spin text-brand" />}
            {state === "ok" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {state === "error" && <AlertCircle className="h-5 w-5 text-rose-600" />}
            <p className="font-display text-sm uppercase tracking-wider text-slate-900">
              {state === "working" && "Signing you in"}
              {state === "ok" && "Success"}
              {state === "error" && "Sign-in failed"}
            </p>
          </div>
          <p className="mt-3 font-mono text-xs leading-relaxed text-slate-600">
            {msg}
          </p>
          {state === "error" && (
            <a
              href="/client"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-slate-700 hover:border-brand hover:text-brand"
            >
              ← Back to client sign-in
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
