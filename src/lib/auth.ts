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
 * Demo fallback (INSECURE — off in production):
 *   Unless ALLOW_DEMO_AUTH=0 is set, we fall back to the caller-supplied email
 *   so the no-inbox demo flow (?demo=1) keeps working. While this is on, real
 *   tokens ARE still verified when present, but a request without a token can
 *   pass any email — impersonation protection is BUILT but NOT ENFORCED.
 *
 * Lock it down (e.g. approaching mainnet): set env ALLOW_DEMO_AUTH=0. Every
 * request then MUST carry a valid session token — no code change, no source
 * redeploy needed. Confirm magic-link login works end-to-end first.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Demo is ON unless explicitly disabled with ALLOW_DEMO_AUTH=0 (still testnet).
const DEMO_ALLOWED = process.env.ALLOW_DEMO_AUTH !== "0";

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
