/**
 * Minimal in-memory rate limiter (sliding window).
 *
 * Purpose: blunt naive abuse of cost-bearing endpoints (Groq LLM calls in
 * /api/verify and /api/agent) so a stranger can't run up the GROQ_API_KEY bill
 * by hammering them in a loop.
 *
 * LIMITATION: state lives in the process memory of a single serverless
 * instance. On Vercel, concurrent instances each keep their own counter and the
 * map resets on cold start, so this is a speed bump, not a wall. For a hard
 * guarantee, back this with a shared store (Supabase table or Upstash Redis) —
 * see SECURITY notes. It is still worth having: it stops the trivial single-IP
 * flood that would otherwise burn real money.
 */

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

// Opportunistic cleanup so the map can't grow unbounded across a long-lived
// warm instance. Runs at most once per call, O(n) over expired keys only.
function sweep(now: number) {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** seconds until the window resets (only meaningful when ok === false) */
  retryAfter: number;
}

/**
 * @param key      unique bucket key (e.g. `verify:${ip}`)
 * @param limit    max requests allowed per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 5000) sweep(now); // keep memory bounded on busy instances

  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (hit.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((hit.resetAt - now) / 1000) };
  }
  hit.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
