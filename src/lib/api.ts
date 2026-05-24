/**
 * Thin browser-side API client. Wraps fetch() with typed helpers.
 * All endpoints are same-origin so no base URL is needed.
 */

import type { Order, Message, OrderStatus } from "./orders";

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
  }
  return data as T;
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
