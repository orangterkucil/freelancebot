/**
 * The public origin this deployment is canonically served from.
 *
 * Used to resolve relative OG images into absolute URLs and to stamp the share
 * card's own URL. It lives in its own module rather than in layout.tsx so that
 * client components can import it without pulling the font loaders and the rest
 * of the root layout into the browser bundle.
 *
 * Set NEXT_PUBLIC_SITE_URL to move the site to another domain. The fallback is
 * the Vercel domain, which stays live regardless — so an unset variable can
 * never produce a share card pointing at a host that does not resolve.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://freelancebot-alpha.vercel.app";
