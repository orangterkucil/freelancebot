/**
 * Server-side caller identity resolution.
 *
 * The old model trusted `actor_email` sent in the request body/query — anyone
 * could pass a victim's email and impersonate them. This resolves the caller's
 * identity from a VERIFIED Supabase session instead.
 *
 * Trusted path:
 *   The browser client sends `Authorization: Bearer <supabase access_token>`.
 *   We validate that JWT with Supabase (auth.getUser) and take the email from
 *   the validated token. This cannot be spoofed.
 *
 * Demo fallback (INSECURE — OFF unless explicitly enabled):
 *   When enabled, we fall back to the caller-supplied email so the no-inbox demo
 *   flow (?demo=1) works without an inbox. While it is on, a request with NO
 *   token can pass ANY email and be treated as that person — full impersonation.
 *
 *   This defaults to OFF and must be turned on deliberately with
 *   ALLOW_DEMO_AUTH=1. It previously defaulted to ON ("unless =0"), which is
 *   fail-open: forgetting to set an env var left production wide open. A
 *   verified probe against production returned another account's orders, emails,
 *   and payout wallet with no token attached. Security defaults must fail
 *   CLOSED, so the polarity is inverted here.
 *
 * To run an open demo anyway (local, or a throwaway environment with no real
 * data): set ALLOW_DEMO_AUTH=1. Never set it on an environment holding data you
 * care about.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Fail CLOSED: demo impersonation is OFF unless explicitly enabled with =1.
const DEMO_ALLOWED = process.env.ALLOW_DEMO_AUTH === "1";

let _authClient: SupabaseClient | null = null;
function authClient(): SupabaseClient {
  if (_authClient) return _authClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase auth env vars missing");
  _authClient = createClient(url, key, { auth: { persistSession: false } });
  return _authClient;
}

export interface Identity {
  /** lowercased email, or null when unauthenticated (and demo disabled) */
  email: string | null;
  /** true = from a validated session token; false = demo fallback */
  verified: boolean;
}

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1]!.trim() : null;
}

/**
 * Resolve who is calling. `fallbackEmail` (from the request body/query) is only
 * honoured in demo mode; in production an invalid/missing token yields
 * { email: null }, and the route should answer 401.
 */
export async function getIdentity(req: Request, fallbackEmail?: string): Promise<Identity> {
  const token = bearerToken(req);
  if (token) {
    try {
      const { data, error } = await authClient().auth.getUser(token);
      const email = data?.user?.email?.toLowerCase() ?? null;
      if (!error && email) return { email, verified: true };
    } catch {
      /* fall through to demo / unauthenticated */
    }
  }
  if (DEMO_ALLOWED && fallbackEmail && fallbackEmail.includes("@")) {
    return { email: fallbackEmail.trim().toLowerCase(), verified: false };
  }
  return { email: null, verified: false };
}

/** Whether demo fallback is currently enabled (for logging / diagnostics). */
export const demoAuthEnabled = DEMO_ALLOWED;
