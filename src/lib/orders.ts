import { supabaseAdmin } from "./supabase";

/**
 * Order + message DB helpers.
 *
 * The on-chain escrow lives in FreelanceEscrow.sol. This module is the off-chain
 * mirror: a database row per order, plus a chat thread per order. The on-chain
 * order id (`onchain_id`) is filled in once the client funds the escrow.
 */

export type OrderStatus =
  | "draft"        // created off-chain, not yet funded
  | "funded"       // client has funded the on-chain escrow
  | "delivered"   // freelancer submitted deliverable
  | "released"    // funds released to freelancer
  | "refunded"    // refunded back to client
  | "disputed";   // not used in MVP, reserved

export type Order = {
  id: number;
  onchain_id: number | null;
  client_email: string;
  freelancer_email: string;
  brief: string;
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

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createOrder(input: {
  client_email: string;
  freelancer_email: string;
  brief: string;
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
