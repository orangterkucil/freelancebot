/**
 * Tiny structured logger. Stdout JSON in production (Vercel logs parse this),
 * pretty in development. Intentionally has zero dependencies so it works in
 * both edge and node runtimes.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("order.created", { orderId: 42 });
 *   logger.error("agent.failed", { orderId: 42, err: String(e) });
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel: Level =
  (process.env.LOG_LEVEL as Level) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const isPretty = process.env.NODE_ENV !== "production";

function emit(level: Level, event: string, fields?: Record<string, unknown>) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return;

  const base = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(fields ?? {}),
  };

  if (isPretty) {
    const color =
      level === "error" ? "\x1b[31m" :
      level === "warn"  ? "\x1b[33m" :
      level === "info"  ? "\x1b[36m" :
                          "\x1b[90m";
    const reset = "\x1b[0m";
    const extra = fields ? " " + JSON.stringify(fields) : "";
    // eslint-disable-next-line no-console
    console.log(`${color}${level.toUpperCase()}${reset} ${event}${extra}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(base));
  }
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => emit("debug", event, fields),
  info:  (event: string, fields?: Record<string, unknown>) => emit("info",  event, fields),
  warn:  (event: string, fields?: Record<string, unknown>) => emit("warn",  event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
