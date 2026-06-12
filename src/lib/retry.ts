import { logger } from "./logger";

/**
 * Retry an async function with exponential backoff + jitter.
 *
 * Defaults: 3 attempts, 250ms base, max 4000ms, full jitter.
 * Only retries on errors (you can pass `shouldRetry` to filter, e.g. don't
 * retry 4xx HTTP responses).
 *
 * Usage:
 *   const data = await withRetry(() => groq.chat.completions.create({...}));
 */

export type RetryOptions = {
  attempts?: number;
  baseMs?: number;
  maxMs?: number;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
  label?: string; // for logging
};

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts    = opts.attempts ?? 3;
  const baseMs      = opts.baseMs ?? 250;
  const maxMs       = opts.maxMs ?? 4000;
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;
  const label       = opts.label ?? "withRetry";

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !shouldRetry(err, attempt)) {
        logger.warn("retry.exhausted", { label, attempt, attempts, err: String(err) });
        throw err;
      }
      const expo  = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
      const delay = Math.floor(Math.random() * expo); // full jitter
      logger.info("retry.scheduled", { label, attempt, delayMs: delay, err: String(err) });
      if (opts.onRetry) opts.onRetry(err, attempt, delay);
      await sleep(delay);
    }
  }
  throw lastErr; // unreachable, but TS appeasement
}

function defaultShouldRetry(err: unknown): boolean {
  // Don't retry on auth / validation errors. Retry on 5xx, timeouts, network.
  const msg = String(err ?? "").toLowerCase();
  if (msg.includes("401") || msg.includes("403") || msg.includes("404")) return false;
  if (msg.includes("400") || msg.includes("bad request")) return false;
  return true;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
