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
    const raw = err?.message ?? String(err);
    logger.error("api.keepalive.failed", { err: raw });

    // A paused/restoring Supabase answers through Cloudflare with a full HTML
    // error page. Don't echo kilobytes of markup back as "detail" — classify it.
    const isHtml = /<!DOCTYPE html|<html/i.test(raw);
    const paused = isHtml && /\b52[0-9]\b|web server is down/i.test(raw);
    const detail = paused
      ? "Supabase is unreachable (paused or restoring). Restore the project in the Supabase dashboard."
      : isHtml
        ? "Upstream returned an HTML error page instead of a database response."
        : raw.slice(0, 300);

    return NextResponse.json({ ok: false, db: "unreachable", detail }, { status: 503 });
  }
}
