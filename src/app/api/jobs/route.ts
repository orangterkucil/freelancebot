import { NextResponse } from "next/server";
import { listOpenJobs, FIELDS, type Field } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/jobs
 *
 * Public marketplace feed. No auth required.
 * Query params:
 *   field=design|dev|writing|video|marketing|research|other
 *   min=<usdc>
 *   max=<usdc>
 *   q=<search string>
 *   limit=<n>  (default 50, max 100)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fieldRaw = url.searchParams.get("field");
    const field = fieldRaw && (FIELDS as readonly string[]).includes(fieldRaw)
      ? (fieldRaw as Field)
      : null;

    const min   = parsePositive(url.searchParams.get("min"));
    const max   = parsePositive(url.searchParams.get("max"));
    const q     = url.searchParams.get("q")?.trim() || null;
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

    const jobs = await listOpenJobs({
      field,
      minBudget: min,
      maxBudget: max,
      search:    q,
      limit,
    });

    return NextResponse.json({ jobs, fields: FIELDS });
  } catch (err: any) {
    return NextResponse.json(
      { error: "jobs_list_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

function parsePositive(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
