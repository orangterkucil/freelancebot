/**
 * Privacy helpers — never expose raw emails in public views.
 *
 * Rules of thumb:
 *   - Public marketplace, landing preview, job cards, ratings feed → use
 *     `displayName()` which prefers X/GitHub handles, then falls back to
 *     `maskEmail()`.
 *   - Order detail, dashboard my-orders list, applications I own → show the
 *     full email freely (the viewer is authorized by `assertActorIsParty`).
 *   - Trust markers (star rating, review count) remain public.
 *
 * v0.12.0
 */

import type { ClientLinks } from "@/lib/orders";

/** Mask `alice.smith@gmail.com` → `a••••••h@gmail.com`. */
export function maskEmail(email?: string | null): string {
  if (!email) return "anonymous";
  const at = email.indexOf("@");
  if (at < 0) return maskString(email);
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${maskString(local)}@${domain}`;
}

function maskString(s: string): string {
  const clean = s.trim();
  if (clean.length <= 2) return clean[0] + "•";
  if (clean.length <= 4) return clean[0] + "•".repeat(clean.length - 2) + clean.slice(-1);
  return clean[0] + "•".repeat(Math.min(clean.length - 2, 6)) + clean.slice(-1);
}

/**
 * Pick the most professional public label for a user.
 *
 *   1. `@xhandle` if their profile has an X handle
 *   2. `gh/user` if their profile has a GitHub handle
 *   3. domain-anonymized email (`a•••e@gmail.com`)
 *   4. `anonymous` fallback
 */
export function displayName(email?: string | null, links?: ClientLinks | null): string {
  const x = links?.x?.trim();
  if (x) return `@${x.replace(/^@/, "")}`;
  const gh = links?.github?.trim();
  if (gh) return `gh/${gh.replace(/^@/, "")}`;
  return maskEmail(email);
}

/**
 * "Is the viewer authorized to see the raw email of this counterparty?"
 * Used to decide whether to render the full email or a masked version.
 */
export function canSeeRawEmail(opts: {
  viewerEmail?: string | null;
  clientEmail?: string;
  freelancerEmail?: string;
}): boolean {
  const v = (opts.viewerEmail || "").toLowerCase();
  if (!v) return false;
  return (
    v === (opts.clientEmail || "").toLowerCase() ||
    v === (opts.freelancerEmail || "").toLowerCase()
  );
}

/**
 * Short avatar-y initial (single char) derived from displayName. Handy for
 * decorative avatars where we don't want to leak identity but still want
 * visual continuity per user.
 */
export function initialFor(email?: string | null, links?: ClientLinks | null): string {
  const name = displayName(email, links);
  const stripped = name.replace(/^@|^gh\//, "");
  return (stripped[0] || "•").toUpperCase();
}
