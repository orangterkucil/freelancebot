/**
 * Thin browser-side API client. Wraps fetch() with typed helpers + retry/backoff.
 * All endpoints are same-origin so no base URL is needed.
 *
 * v0.9.1 — every mutating call now passes the caller's actor_email so the
 * server can verify they are a party to the order. The actor_email comes from
 * the page-level signed-in identity (localStorage). Spoof risk is acknowledged
 * in PRD.md; real auth lands in MVP 2.
 */

import type { Order, Message, OrderStatus, Application, Field, ClientLinks, Rating, RatingSummary } from "./orders";
import { supabaseBrowser } from "./supabase";

/**
 * Attach the signed-in user's Supabase access token so the server can verify
 * the caller's identity instead of trusting a spoofable actor_email. Returns an
 * empty object when there is no session (demo mode / signed out).
 */
async function authHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const attempts = 3;
  const baseMs   = 300;
  let lastErr: unknown;

  const auth = await authHeader();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(input, {
        ...init,
        headers: { "Content-Type": "application/json", ...auth, ...(init?.headers ?? {}) },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
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
      const expo  = Math.min(4000, baseMs * 2 ** (attempt - 1));
      const delay = Math.floor(Math.random() * expo);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Pick the caller's email from localStorage. Prefers the role currently in use. */
export function readActorEmail(prefer?: "client" | "freelancer"): string {
  if (typeof window === "undefined") return "";
  try {
    const c = window.localStorage.getItem("fb_client_email") ?? "";
    const f = window.localStorage.getItem("fb_freelancer_email") ?? "";
    if (prefer === "client" && c) return c;
    if (prefer === "freelancer" && f) return f;
    return c || f || "";
  } catch {
    return "";
  }
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
  attachments?: unknown[];
  client_links?: ClientLinks;
  amount_usdc: number;
  deadline?: string | null;
  poster_role?: "client" | "freelancer";
}) {
  return jsonFetch<{ order: Order }>(`/api/orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getOrder(orderId: number, actorEmail?: string) {
  const email = actorEmail ?? readActorEmail();
  return jsonFetch<{ order: Order; messages: Message[] }>(
    `/api/orders/${orderId}${email ? "?actor_email=" + encodeURIComponent(email) : ""}`
  );
}

export function patchOrder(orderId: number, patch: { onchain_id?: number; status?: OrderStatus }, actorEmail?: string) {
  const actor = actorEmail ?? readActorEmail();
  return jsonFetch<{ order: Order }>(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, actor_email: actor }),
  });
}

// ---- Agent ---------------------------------------------------------------

export function sendChat(orderId: number, role: "client" | "freelancer", message: string, actorEmail?: string) {
  const actor = actorEmail ?? readActorEmail(role);
  return jsonFetch<{ reply: string; message: Message }>(`/api/agent`, {
    method: "POST",
    body: JSON.stringify({ orderId, role, message, actor_email: actor }),
  });
}

export function verifyDeliverable(orderId: number, deliverableUrl: string, actorEmail?: string) {
  const actor = actorEmail ?? readActorEmail("freelancer");
  return jsonFetch<{
    verified: boolean;
    confidence: "low" | "medium" | "high";
    reasoning: string;
    checks: { urlReachable: boolean; deadlineMet: boolean; briefAlignment: string };
  }>(`/api/verify`, {
    method: "POST",
    body: JSON.stringify({ orderId, deliverableUrl, actor_email: actor }),
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

export function listApplicationsForOrder(orderId: number, actorEmail?: string) {
  const actor = actorEmail ?? readActorEmail("client");
  return jsonFetch<{ applications: Application[] }>(
    `/api/applications?order_id=${orderId}${actor ? "&email=" + encodeURIComponent(actor) : ""}`
  );
}

export function listMyApplications(email: string) {
  return jsonFetch<{ applications: Application[] }>(`/api/applications?email=${encodeURIComponent(email)}`);
}

export function decideApplication(applicationId: number, body: {
  status: "accepted" | "rejected" | "withdrawn";
  order_id?: number;
  freelancer_email?: string;
}, actorEmail?: string) {
  const actor = actorEmail ?? readActorEmail();
  return jsonFetch<{ ok: boolean }>(`/api/applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify({ ...body, actor_email: actor }),
  });
}

// ---- Ratings (v0.11.0) ---------------------------------------------------

export function submitRating(body: {
  order_id: number;
  ratee_email: string;
  stars: number;
  comment?: string;
}, actorEmail?: string) {
  const actor = actorEmail ?? readActorEmail();
  return jsonFetch<{ rating: Rating }>(`/api/ratings`, {
    method: "POST",
    body: JSON.stringify({ ...body, actor_email: actor }),
  });
}

export function getRatingSummary(email: string) {
  return jsonFetch<RatingSummary>(`/api/ratings?email=${encodeURIComponent(email)}&summary=1`);
}

export function listRatingsForRatee(email: string) {
  return jsonFetch<{ ratings: Rating[] }>(`/api/ratings?email=${encodeURIComponent(email)}`);
}

export function listRatingsForOrder(orderId: number) {
  return jsonFetch<{ ratings: Rating[] }>(`/api/ratings?order_id=${orderId}`);
}
