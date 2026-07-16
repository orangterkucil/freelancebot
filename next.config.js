/** @type {import('next').NextConfig} */

// Security headers applied to every route. These are all safe for the app's
// runtime (wallet, Supabase, Arc RPC) — they harden the browser against
// clickjacking, MIME sniffing, referrer leakage, and protocol downgrade without
// touching script/style/connect sources. A full script-src CSP is deliberately
// left out: it needs per-release nonce work and testing against the MetaMask
// flow, and a broken CSP would break the live demo. frame-ancestors below still
// blocks clickjacking, which is the highest-value CSP directive here.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
