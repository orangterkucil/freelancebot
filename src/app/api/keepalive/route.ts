import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/keepalive
 *
 * Supabase's free tier pauses a project after ~7 days with no database
 * activity, which takes the whole app down until it is manually restored. This
 * endpoint performs one trivial read so the project always counts as active.
 *
 * It is driven by the Vercel cron defined in vercel.json (daily), well inside
 * the 7-day window. Safe to call publicly: it reads a single id, writes
 * nothing, and returns no user data.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    const sb = supabaseAdmin();
    const { error } = await sb.from("orders").select("id").limit(1);
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      db: "reachable",
      tookMs: Date.now() - startedAt,
    });
  } catch (err: any) {
    // Surface it loudly — if this fails, the project is probably paused again.
    logger.error("api.keepalive.failed", { err: err?.message ?? String(err) });
    return NextResponse.json(
      { ok: false, db: "unreachable", detail: err?.message ?? String(err) },
      { status: 503 }
    );
  }
}
