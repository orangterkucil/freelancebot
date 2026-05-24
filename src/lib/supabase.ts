import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase clients.
 *
 * Both are lazy (function calls, NOT module-level constants) so that importing
 * this file at build time does not require env vars to exist. Next.js's "collect
 * page data" phase imports route modules during build and would otherwise crash
 * if the env vars are not yet set in the build environment.
 */

let _browserClient: SupabaseClient | null = null;

/** Browser-safe client. Uses the publishable key (RLS enforces access control). */
export function supabaseBrowser(): SupabaseClient {
  if (_browserClient) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"
    );
  }
  _browserClient = createClient(url, key);
  return _browserClient;
}

/**
 * Server-side client with elevated privileges. Use ONLY from API routes / server code.
 * Bypasses RLS. Never import this from client components.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, secret, { auth: { persistSession: false } });
}
