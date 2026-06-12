/**
 * Thin browser-side API client. Wraps fetch() with typed helpers + retry/backoff.
 * All endpoints are same-origin so no base URL is needed.
 */

import type { Order, Message, OrderStatus } from "./orders";

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
