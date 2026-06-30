import { supabaseAdmin } from "./supabase";

/**
 * Order + message + application DB helpers.
 *
 * The on-chain escrow lives in FreelanceEscrow.sol. This module is the off-chain
 * mirror: a database row per order, a chat thread per order, and (v0.9.0) a
 * marketplace + applications layer so jobs can be discovered publicly.
 */

export type OrderStatus =
  | "draft"        // created off-chain, not yet funded (also: public job listing if is_public)
  | "funded"       // client has funded the on-chain escrow
  | "delivered"    // freelancer submitted deliverable
  | "released"     // funds released to freelancer
  | "refunded"     // refunded back to client
  | "disputed";    // reserved

/** Categories shown in the field filter on /jobs. */
export const FIELDS = [
  "design",      // logo, UX, illustration
  "dev",         // web, mobile, backend, smart contract
  "writing",     // copywriting, technical writing, translation
  "video",       // video editing, motion graphics
  "marketing",   // growth, SEO, ads
  "research",    // user research, market research
  "other",
] as const;

export type Field = typeof FIELDS[number];

export type Order = {
  id: number;
  onchain_id: number | null;
  client_email: string;
  freelancer_email: string;
  brief: string;
  title: string | null;
  field: Field;
  is_public: boolean;
  amount_usdc: number;
  deadline: string | null;
  status: OrderStatus;
  deliverable_url: string | null;
  agent_notes: string | null;
  created_at: string;
};

export type Message = {
  id: number;
  order_id: number;
  role: "client" | "freelancer" | "agent" | "system";
  content: string;
  created_at: string;
};

export type Application = {
  id: number;
  order_id: number;
  freelancer_email: string;
  pitch: string | null;
  bid_amount_usdc: number | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createOrder(input: {
  client_email: string;
  freelancer_email: string;
  brief: string;
  title?: string | null;
  field?: Field;
  is_public?: boolean;
  amount_usdc: number;
  deadline: string | null;
}): Promise<Order> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("orders")
    .insert({
      client_email:     input.client_email,
      freelancer_email: input.freelancer_email,
      brief:            input.brief,
      title:            input.title ?? null,
      field:            input.field ?? "other",
      is_public:        input.is_public ?? false,
      amount_usdc:      input.amount_usdc,
      deadline:         input.deadline,
      status:           "draft",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

export async function getOrder(orderId: number): Promise<Order | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return (data as Order) ?? null;
}

/**
 * Authorization helper. Used by every mutating API route + by GETs that return
 * private data (chat messages, applications).
 *
 * Returns the order plus the actor's role on it, or { role: null } if the actor
 * is not a party. Until MVP 2 ships real auth, the API trusts the actor_email
 * the client sends — the spoof risk is acknowledged in the security model.
 * Tradeoff is documented in PRD.md §3 (MVP 1 limitations).
 */
export async function assertActorIsParty(
  orderId: number,
  actorEmail: string | null | undefined
): Promise<{ role: "client" | "freelancer" | null; order: Order | null }> {
  const order = await getOrder(orderId);
  if (!order || !actorEmail) return { role: null, order };
  const lower = actorEmail.toLowerCase().trim();
  if (order.client_email.toLowerCase() === lower)     return { role: "client",     order };
  if (order.freelancer_email.toLowerCase() === lower) return { role: "freelancer", order };
  return { role: null, order };
}

export async function listOrdersForEmail(email: string): Promise<Order[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .or(`client_email.eq.${email},freelancer_email.eq.${email}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

/** v0.9.0 — public marketplace feed. Lists open jobs anyone can see. */
export async function listOpenJobs(opts: {
  field?: Field | null;
  minBudget?: number | null;
  maxBudget?: number | null;
  search?: string | null;
  limit?: number;
} = {}): Promise<Order[]> {
  const sb = supabaseAdmin();
  let q = sb
    .from("orders")
    .select("*")
    .eq("is_public", true)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.field)     q = q.eq("field", opts.field);
  if (opts.minBudget) q = q.gte("amount_usdc", opts.minBudget);
  if (opts.maxBudget) q = q.lte("amount_usdc", opts.maxBudget);
  if (opts.search) {
    // simple ilike on brief + title
    q = q.or(`brief.ilike.%${opts.search}%,title.ilike.%${opts.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function setOrderOnchainId(orderId: number, onchainId: number): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("orders")
    .update({ onchain_id: onchainId, status: "funded" })
    .eq("id", orderId);
  if (error) throw error;
}

export async function setOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) throw error;
}

export async function setOrderFreelancer(orderId: number, freelancer_email: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("orders")
    .update({ freelancer_email, is_public: false })
    .eq("id", orderId);
  if (error) throw error;
}

export async function setOrderDeliverable(orderId: number, url: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("orders")
    .update({ deliverable_url: url, status: "delivered" })
    .eq("id", orderId);
  if (error) throw error;
}

export async function appendAgentNotes(orderId: number, note: string): Promise<void> {
  const sb = supabaseAdmin();
  const existing = await getOrder(orderId);
  const prev = existing?.agent_notes ?? "";
  const next = prev ? `${prev}\n---\n${note}` : note;
  const { error } = await sb.from("orders").update({ agent_notes: next }).eq("id", orderId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function listMessages(orderId: number): Promise<Message[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function appendMessage(
  orderId: number,
  role: Message["role"],
  content: string
): Promise<Message> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("messages")
    .insert({ order_id: orderId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

// ---------------------------------------------------------------------------
// Applications (v0.9.0 marketplace)
// ---------------------------------------------------------------------------

export async function createApplication(input: {
  order_id: number;
  freelancer_email: string;
  pitch?: string;
  bid_amount_usdc?: number;
}): Promise<Application> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("applications")
    .insert({
      order_id:         input.order_id,
      freelancer_email: input.freelancer_email,
      pitch:            input.pitch ?? null,
      bid_amount_usdc:  input.bid_amount_usdc ?? null,
      status:           "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Application;
}

export async function listApplicationsForOrder(orderId: number): Promise<Application[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("applications")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Application[];
}

export async function listApplicationsByFreelancer(email: string): Promise<Application[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("applications")
    .select("*")
    .eq("freelancer_email", email)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Application[];
}

export async function setApplicationStatus(applicationId: number, status: Application["status"]): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("applications")
    .update({ status })
    .eq("id", applicationId);
  if (error) throw error;
}
