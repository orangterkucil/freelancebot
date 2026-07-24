import { NextResponse } from "next/server";
import { listMarketActivity } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/activity
 *
 * Public market activity / history feed. No auth required. Returns recent orders
 * that have moved past "open" — funded, delivered, released, or refunded — each
 * scrubbed of PII and enriched with the poster's privacy-safe label + rating.
 * Query: limit=<n> (default 30, max 60)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") ?? 30)));
    const activity = await listMarketActivity(limit);
    return NextResponse.json({ activity });
  } catch (err: any) {
    return NextResponse.json(
      { error: "activity_list_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
