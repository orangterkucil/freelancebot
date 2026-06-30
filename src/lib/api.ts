/**
 * Thin browser-side API client. Wraps fetch() with typed helpers + retry/backoff.
 * All endpoints are same-origin so no base URL is needed.
 */

import type { Order, Message, OrderStatus, Application, Field } from "./orders";

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const attempts = 3;
  const baseMs   = 300;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(input, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Don't retry on 4xx — those are our fault, not transient.
        if (res.status >= 400 && res.status < 500) {
          throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
        }
        throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
      }
      return data as T;
    } catch (err) {
      lastErr = err;
      const msg = String(err ?? "").toLowerCase();
      const isClientError = msg.includes("http 4");
      if (isClientError || attempt === attempts) break;
      // exponential backoff with full jitter
      const expo  = Math.min(4000, baseMs * 2 ** (attempt - 1));
      const delay = Math.floor(Math.random() * expo);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ---- Orders --------------------------------------------------------------

export function listOrders(email: string) {
  return jsonFetch<{ orders: Order[] }>(`/api/orders?email=${encodeURIComponent(email)}`);
}

export function createOrder(body: {
  client_email: string;
  freelancer_email: string;
  brief: string;
  title?: string | null;
  field?: Field;
  is_public?: boolean;
  amount_usdc: number;
  deadline?: string | null;
}) {
  return jsonFetch<{ order: Order }>(`/api/orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getOrder(orderId: number) {
  return jsonFetch<{ order: Order; messages: Message[] }>(`/api/orders/${orderId}`);
}

export function patchOrder(orderId: number, patch: { onchain_id?: number; status?: OrderStatus }) {
  return jsonFetch<{ order: Order }>(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ---- Agent ---------------------------------------------------------------

export function sendChat(orderId: number, role: "client" | "freelancer", message: string) {
  return jsonFetch<{ reply: string; message: Message }>(`/api/agent`, {
    method: "POST",
    body: JSON.stringify({ orderId, role, message }),
  });
}

export function verifyDeliverable(orderId: number, deliverableUrl: string) {
  return jsonFetch<{
    verified: boolean;
    confidence: "low" | "medium" | "high";
    reasoning: string;
    checks: { urlReachable: boolean; deadlineMet: boolean; briefAlignment: string };
  }>(`/api/verify`, {
    method: "POST",
    body: JSON.stringify({ orderId, deliverableUrl }),
  });
}

// ---- Marketplace (v0.9.0) -------------------------------------------------

export function listJobs(opts: {
  field?: Field | "all";
  min?: number;
  max?: number;
  q?: string;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (opts.field && opts.field !== "all") params.set("field", opts.field);
  if (opts.min)   params.set("min",   String(opts.min));
  if (opts.max)   params.set("max",   String(opts.max));
  if (opts.q)     params.set("q",     opts.q);
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return jsonFetch<{ jobs: Order[]; fields: readonly string[] }>(
    `/api/jobs${qs ? "?" + qs : ""}`
  );
}

export function applyToJob(body: {
  order_id: number;
  freelancer_email: string;
  pitch?: string;
  bid_amount_usdc?: number;
}) {
  return jsonFetch<{ application: Application }>(`/api/applications`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listApplicationsForOrder(orderId: number) {
  return jsonFetch<{ applications: Application[] }>(`/api/applications?order_id=${orderId}`);
}

export function listMyApplications(email: string) {
  return jsonFetch<{ applications: Application[] }>(`/api/applications?email=${encodeURIComponent(email)}`);
}

export function decideApplication(applicationId: number, body: {
  status: "accepted" | "rejected" | "withdrawn";
  order_id?: number;
  freelancer_email?: string;
}) {
  return jsonFetch<{ ok: boolean }>(`/api/applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
