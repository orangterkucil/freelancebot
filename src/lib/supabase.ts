import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Browser-safe client. Use this from React components / client code.
export const supabase = createClient(url, publishableKey);

// Server-side client with elevated privileges. Use ONLY from API routes / server code.
export function supabaseAdmin() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, secret, {
    auth: { persistSession: false },
  });
}
