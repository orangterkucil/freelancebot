import { supabaseAdmin } from "./supabase";
import { displayName } from "./privacy";

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

export type Attachment = {
  filename:     string;
  url:          string;
  size_bytes:   number;
  content_type: string;
  uploaded_by:  string;
  created_at:   string;
};

export type ClientLinks = {
  x?:        string;   // twitter/x handle e.g. "geografinist" or full URL
  github?:   string;   // github username e.g. "orangterkucil" or full URL
  website?:  string;   // any URL
  linkedin?: string;
  other?:    string;
};

export type PosterRole = "client" | "freelancer";

export type Order = {
  id: number;
  onchain_id: number | null;
  client_email: string;
  freelancer_email: string;
  freelancer_wallet: string | null;   // on-chain payout address (set when freelancer connects wallet)
  brief: string;
  title: string | null;
  field: Field;
  is_public: boolean;
  amount_usdc: number;
  deadline: string | null;
  status: OrderStatus;
  deliverable_url: string | null;
  agent_notes: string | null;
  attachments: Attachment[];
  client_links: ClientLinks;
  poster_role: PosterRole;   // v0.13.0 — bilateral marketplace
  created_at: string;

  // Computed, PUBLIC-SAFE fields (only set by enrichPublicOrder for public feeds).
  // They let job cards / activity show WHO posted + their reputation without ever
  // exposing the raw email: a privacy-safe handle/masked-email label + a rating
  // summary derived server-side from the real email.
  poster_label?: string;
  poster_rating?: { average: number; count: number } | null;
};

/**
 * Strip everything a non-party (public marketplace visitor) must not see, while
 * keeping the shape as `Order` so callers/components don't need type changes.
 *
 * Kept public: the descriptive job fields (title, brief, budget, field,
 * deadline, status) — a job listing is meant to be readable so people can apply.
 * Removed: counterparty emails (PII), the freelancer's deliverable, uploaded
 * attachments (the client's private material), private client links, and the
 * internal AI agent notes. Full data is only returned to a party of the order.
 *
 * NOTE: emails are blanked here, so public job cards can't show the poster's
 * email-keyed reputation. A pseudonymous display handle is the follow-up.
 */
export function scrubOrderForPublic(o: Order): Order {
  return {
    ...o,
    client_email: "",
    freelancer_email: "",
    freelancer_wallet: null,
    deliverable_url: null,
    agent_notes: null,
    attachments: [],
    client_links: {},
  };
}

/**
 * Scrub an order for public display AND attach the poster's privacy-safe label
 * + reputation. The raw email is used only server-side to look up the rating and
 * derive a masked/handle label — it is never returned. This is how public job
 * cards / the activity feed show "who posted + how trusted" without leaking PII.
 */
export async function enrichPublicOrder(o: Order): Promise<Order> {
  const posterEmail = o.poster_role === "freelancer" ? o.freelancer_email : o.client_email;
  const scrubbed = scrubOrderForPublic(o);
  let poster_rating: { average: number; count: number } | null = null;
  try {
    if (posterEmail) {
      const s = await getRatingSummary(posterEmail);
      poster_rating = { average: s.average, count: s.count };
    }
  } catch { /* rating is best-effort */ }
  return {
    ...scrubbed,
    poster_label: displayName(posterEmail, o.client_links),
    poster_rating,
  };
}

export function enrichPublicOrders(list: Order[]): Promise<Order[]> {
  return Promise.all(list.map(enrichPublicOrder));
}

/**
 * Market activity / history: recent orders that have moved past "open" — funded
 * (escrow locked), delivered (in review), released (paid on-chain), or refunded.
 * Public + scrubbed + enriched. Powers the marketplace's live activity feed.
 */
export async function listMarketActivity(limit = 30): Promise<Order[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .in("status", ["funded", "delivered", "released", "refunded"])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  const orders = (data ?? []) as Order[];

  // PRIVACY: only show PUBLIC-ORIGIN orders. A marketplace job always has ≥1
  // application (someone applied → was accepted → funded); a private DIRECT
  // order (client hires a specific person, never listed) has none. Filtering on
  // "is_public now OR ever had an application" keeps private deals — their
  // brief/title/amount — out of the public activity feed.
  const ids = orders.map((o) => o.id);
  let hadApps = new Set<number>();
  if (ids.length) {
    const { data: apps } = await sb.from("applications").select("order_id").in("order_id", ids);
    hadApps = new Set((apps ?? []).map((a: any) => a.order_id));
  }
  const publicOrigin = orders.filter((o) => o.is_public || hadApps.has(o.id));
  return enrichPublicOrders(publicOrigin.slice(0, Math.min(60, Math.max(1, limit))));
}

/** Record the freelancer's on-chain payout wallet (their connected address). */
export async function setFreelancerWallet(orderId: number, wallet: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb.from("orders").update({ freelancer_wallet: wallet }).eq("id", orderId);
  if (error) throw error;
}

export type Rating = {
  id: number;
  order_id: number;
  rater_email: string;
  ratee_email: string;
  rater_role: "client" | "freelancer";
  stars: number;
  comment: string | null;
  created_at: string;
};

export type RatingSummary = {
  email: string;
  count: number;
  average: number; // 0..5, two decimals
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
  attachments?: Attachment[];
  client_links?: ClientLinks;
  amount_usdc: number;
  deadline: string | null;
  poster_role?: PosterRole;   // v0.13.0
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
      attachments:      input.attachments ?? [],
      client_links:     input.client_links ?? {},
      amount_usdc:      input.amount_usdc,
      deadline:         input.deadline,
      poster_role:      input.poster_role ?? "client",
      status:           "draft",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

// ---------------------------------------------------------------------------
// Ratings (v0.11.0)
// ---------------------------------------------------------------------------

export async function createRating(input: {
  order_id: number;
  rater_email: string;
  ratee_email: string;
  rater_role: "client" | "freelancer";
  stars: number;
  comment?: string | null;
}): Promise<Rating> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("ratings")
    .insert({
      order_id:    input.order_id,
      rater_email: input.rater_email.toLowerCase().trim(),
      ratee_email: input.ratee_email.toLowerCase().trim(),
      rater_role:  input.rater_role,
      stars:       Math.max(1, Math.min(5, Math.floor(input.stars))),
      comment:     input.comment?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Rating;
}

export async function listRatingsForOrder(orderId: number): Promise<Rating[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("ratings")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rating[];
}

export async function listRatingsForRatee(email: string, limit = 20): Promise<Rating[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("ratings")
    .select("*")
    .eq("ratee_email", email.toLowerCase().trim())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Rating[];
}

export async function getRatingSummary(email: string): Promise<RatingSummary> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("ratings")
    .select("stars")
    .eq("ratee_email", email.toLowerCase().trim());
  if (error) throw error;
  const stars = (data ?? []).map((r: any) => Number(r.stars));
  const count = stars.length;
  const average = count > 0
    ? Math.round((stars.reduce((s, n) => s + n, 0) / count) * 100) / 100
    : 0;
  return { email, count, average };
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

/**
 * Assign a freelancer to the order.
 *
 * v0.13.0: we no longer flip `is_public = false` here. Public jobs stay
 * listed in the marketplace even after a freelancer is picked, so other
 * freelancers can still see the listing (useful for showcase, "similar
 * openings", and for clients who want to hire multiple parallel workers).
 * The status change (draft → funded, etc.) is what indicates a job is no
 * longer accepting applications.
 */
export async function setOrderFreelancer(orderId: number, freelancer_email: string): Promise<void> {
  const sb = supabaseAdmin();
  // Assigning a freelancer means the public job is now taken — flip is_public
  // off so it leaves the marketplace (which lists is_public && status=draft).
  const { error } = await sb
    .from("orders")
    .update({ freelancer_email, is_public: false })
    .eq("id", orderId);
  if (error) throw error;
}

/**
 * Edit an order's editable fields. Callers must enforce that this only happens
 * while the order is a DRAFT (before funding) and by the client — the escrow
 * terms must be immutable once USDC is locked.
 */
export async function updateOrderFields(orderId: number, fields: {
  title?: string | null;
  brief?: string;
  amount_usdc?: number;
  deadline?: string | null;
  field?: Field;
  is_public?: boolean;
}): Promise<void> {
  const sb = supabaseAdmin();
  const patch: Record<string, unknown> = {};
  if (fields.title       !== undefined) patch.title       = fields.title;
  if (fields.brief       !== undefined) patch.brief       = fields.brief;
  if (fields.amount_usdc !== undefined) patch.amount_usdc = fields.amount_usdc;
  if (fields.deadline    !== undefined) patch.deadline    = fields.deadline;
  if (fields.field       !== undefined) patch.field       = fields.field;
  if (fields.is_public   !== undefined) patch.is_public   = fields.is_public;
  if (Object.keys(patch).length === 0) return;
  const { error } = await sb.from("orders").update(patch).eq("id", orderId);
  if (error) throw error;
}

export async function setOrderDeliverable(
  orderId: number,
  url: string,
  files?: Attachment[]
): Promise<void> {
  const sb = supabaseAdmin();
  const update: Record<string, unknown> = { deliverable_url: url, status: "delivered" };
  if (files && files.length) {
    // Merge the freelancer's uploaded deliverable files into the order's
    // attachments (each tagged uploaded_by) so the client reviews the actual
    // work — a real file/photo — not just a link. No new column needed.
    const { data: cur } = await sb.from("orders").select("attachments").eq("id", orderId).single();
    const existing: Attachment[] = ((cur?.attachments as Attachment[]) ?? []).filter(Boolean);
    // Dedup by URL so a resubmit (after a "hold" verdict) doesn't pile up the
    // same files again.
    const seen = new Set<string>();
    update.attachments = [...existing, ...files].filter((a) => {
      if (!a?.url || seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });
  }
  const { error } = await sb.from("orders").update(update).eq("id", orderId);
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
