"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Briefcase,
  Cpu,
  Coins,
  ShieldCheck,
  Star,
  FileText,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

/**
 * Single-page documentation / whitepaper. Sticky table of contents on the left,
 * long-form sections on the right. No external libs — pure Tailwind + lucide.
 */
const SECTIONS = [
  { id: "overview",   label: "Overview",        Icon: BookOpen },
  { id: "problem",    label: "The problem",     Icon: FileText },
  { id: "comparison", label: "Why not X?",      Icon: Coins },
  { id: "solution",   label: "The solution",    Icon: Briefcase },
  { id: "lifecycle",  label: "Order lifecycle", Icon: ArrowRight },
  { id: "marketplace",label: "Marketplace",     Icon: Briefcase },
  { id: "trust",      label: "Trust & ratings", Icon: Star },
  { id: "agent",      label: "AI agent",        Icon: Cpu },
  { id: "contract",   label: "Smart contract",  Icon: Coins },
  { id: "privacy",    label: "Privacy",         Icon: ShieldCheck },
  { id: "roadmap",    label: "Roadmap",         Icon: ArrowRight },
  { id: "faq",        label: "FAQ",             Icon: FileText },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-landing items-center justify-between gap-3 px-5 py-3 lg:px-12">
          <Link href="/" className="group flex items-center gap-2.5">
            <Image src="/logo-mark.svg" alt="FreelanceBot" width={32} height={32} className="transition-transform group-hover:scale-105" />
            <span className="font-display text-sm uppercase tracking-wider text-slate-900">FreelanceBot</span>
            <span className="hidden rounded-full border border-slate-200 bg-white px-1.5 py-px font-mono text-[9px] uppercase text-slate-500 sm:inline-block">
              docs · v0.11.0
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/client" className="font-display text-[12px] uppercase tracking-wider text-slate-600 hover:text-brand">Demo</Link>
            <Link href="/jobs"   className="font-display text-[12px] uppercase tracking-wider text-slate-600 hover:text-brand">Marketplace</Link>
            <a
              href="https://github.com/orangterkucil/freelancebot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-[12px] uppercase tracking-wider text-slate-600 hover:text-brand"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-landing grid-cols-1 lg:grid-cols-[260px_1fr] lg:gap-10 px-5 lg:px-12">
        {/* TOC */}
        <aside className="lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] py-8 lg:py-12">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">On this page</p>
          <nav className="mt-4 space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
              >
                <s.Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand" />
                <span className="font-display text-[12px] uppercase tracking-wider">{s.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Open source</p>
            <p className="mt-1 font-display text-sm uppercase text-slate-900">MIT licensed</p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-slate-600">
              Fork, deploy, contribute. The hosted demo is just one instance — anyone can run their own.
            </p>
            <a
              href="https://github.com/orangterkucil/freelancebot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-brand hover:underline"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="py-8 lg:py-12">
          <div className="prose-doc max-w-3xl">
            <Section id="overview" title="Overview" emoji="📘">
              <p>
                FreelanceBot is an open-source escrow + agentic-payment platform for global freelance work.
                Clients post a job (publicly on the marketplace or privately to a known freelancer), the freelancer accepts,
                an on-chain USDC escrow on Arc holds the funds, and an AI agent verifies the deliverable
                before the client releases payment in sub-second finality.
              </p>
              <p>
                It is not a startup, not a token, not a take-rate platform you can&apos;t leave. The hosted demo lives at
                <a href="https://freelancebot-alpha.vercel.app" className="text-brand hover:underline"> freelancebot-alpha.vercel.app</a>.
                Anyone can fork the repo and deploy their own instance.
              </p>
              <Callout>
                <strong>tl;dr</strong> — Stripe-style payment rails, Upwork-style marketplace, AI agent in the middle. MIT licensed.
              </Callout>
            </Section>

            <Section id="problem" title="The problem" emoji="🧩">
              <p>
                The global freelance workforce is huge — 75M+ in Asia-Pacific alone. But the payment rails are wildly broken:
              </p>
              <ul>
                <li><strong>Cross-border fees</strong> — PayPal + Wise + bank wires eat 5–18% of every gig.</li>
                <li><strong>Delays</strong> — invoice → review → payout often takes 7–21 days.</li>
                <li><strong>Trust gap</strong> — freelancers fear non-payment; clients fear under-delivery.</li>
                <li><strong>Discovery silos</strong> — marketplaces (Upwork/Fiverr) lock both sides into their walled garden.</li>
              </ul>
              <p>
                FreelanceBot doesn&apos;t replace marketplaces — it offers a portable, open-source alternative anyone
                can run, with stablecoin settlement and an AI agent that automates verification.
              </p>
            </Section>

            <Section id="comparison" title="Why not just use existing payment systems?" emoji="⚖️">
              <p>
                Every existing rail — fintech app, remittance service, freelance marketplace, or bank wire — was
                built for a world that doesn&apos;t match today&apos;s cross-border freelance economy. Below is a
                head-to-head on a $300 job sent from a US client to a Jakarta freelancer, the median gig for our
                target user.
              </p>

              <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left font-mono text-[12px]">
                  <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5">Net to freelancer</th>
                      <th className="px-3 py-2.5">Settlement time</th>
                      <th className="px-3 py-2.5">Effective fee</th>
                      <th className="px-3 py-2.5">Escrow?</th>
                      <th className="px-3 py-2.5">Self-custody?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">PayPal (International)</td>
                      <td className="px-3 py-2.5">~$260</td>
                      <td className="px-3 py-2.5">1–3 days</td>
                      <td className="px-3 py-2.5">~13% (4.4% + FX spread ~4–6% + $0.30)</td>
                      <td className="px-3 py-2.5">Disputes only</td>
                      <td className="px-3 py-2.5">No · reversible</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Wise (Business)</td>
                      <td className="px-3 py-2.5">~$284</td>
                      <td className="px-3 py-2.5">~1–2 days</td>
                      <td className="px-3 py-2.5">~5.4% (0.4–1% fee + mid-market ~1% + local bank fees)</td>
                      <td className="px-3 py-2.5">No</td>
                      <td className="px-3 py-2.5">No</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Payoneer</td>
                      <td className="px-3 py-2.5">~$272</td>
                      <td className="px-3 py-2.5">2–5 days</td>
                      <td className="px-3 py-2.5">~9% (2% receive + 3.5% FX + withdrawal + inactivity)</td>
                      <td className="px-3 py-2.5">No</td>
                      <td className="px-3 py-2.5">No · custodial</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">SWIFT wire (bank-to-bank)</td>
                      <td className="px-3 py-2.5">~$248</td>
                      <td className="px-3 py-2.5">2–5 business days</td>
                      <td className="px-3 py-2.5">~17% ($15–50 sender + $15–30 intermediary + $10–30 recipient + FX ~2–4%)</td>
                      <td className="px-3 py-2.5">No</td>
                      <td className="px-3 py-2.5">No</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Western Union</td>
                      <td className="px-3 py-2.5">~$258</td>
                      <td className="px-3 py-2.5">Minutes–hours</td>
                      <td className="px-3 py-2.5">~14% (fixed + FX spread up to 5–7%)</td>
                      <td className="px-3 py-2.5">No</td>
                      <td className="px-3 py-2.5">No</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Upwork</td>
                      <td className="px-3 py-2.5">~$220</td>
                      <td className="px-3 py-2.5">5–14 days (hold + payout)</td>
                      <td className="px-3 py-2.5">~26% (10–20% platform + 2% withdrawal + FX)</td>
                      <td className="px-3 py-2.5">Yes · platform-held</td>
                      <td className="px-3 py-2.5">No · account can be frozen</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Fiverr</td>
                      <td className="px-3 py-2.5">~$225</td>
                      <td className="px-3 py-2.5">14+ days (revenue clearance)</td>
                      <td className="px-3 py-2.5">~25% (20% service + $1–3 withdrawal + FX)</td>
                      <td className="px-3 py-2.5">Yes · platform-held</td>
                      <td className="px-3 py-2.5">No</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Deel / Remote (EOR)</td>
                      <td className="px-3 py-2.5">~$285</td>
                      <td className="px-3 py-2.5">1–3 days</td>
                      <td className="px-3 py-2.5">~5% (SaaS-priced but adds $49–75/mo overhead for the client)</td>
                      <td className="px-3 py-2.5">Contract-based</td>
                      <td className="px-3 py-2.5">No · KYC-heavy</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Stripe Connect</td>
                      <td className="px-3 py-2.5">~$282</td>
                      <td className="px-3 py-2.5">2–7 days</td>
                      <td className="px-3 py-2.5">~6% (2.9% + $0.30 + payout fee + FX)</td>
                      <td className="px-3 py-2.5">Optional · destination charges</td>
                      <td className="px-3 py-2.5">No · custodial</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">Local bank (SEPA/ACH domestic)</td>
                      <td className="px-3 py-2.5">~$298</td>
                      <td className="px-3 py-2.5">0–3 days</td>
                      <td className="px-3 py-2.5">~0.7% (domestic only — cross-border falls back to SWIFT)</td>
                      <td className="px-3 py-2.5">No</td>
                      <td className="px-3 py-2.5">No</td>
                    </tr>
                    <tr className="bg-emerald-50/60">
                      <td className="px-3 py-2.5 font-bold text-emerald-800">FreelanceBot (USDC on Arc)</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-800">$297</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-800">0.8 seconds</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-800">1% (platform, configurable)</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-800">Yes · on-chain smart contract</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-800">Yes · freelancer holds keys</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-500">
                <em>Sources:</em> published fee schedules on paypal.com/us/fees, wise.com/pricing, payoneer.com/pricing,
                stripe.com/pricing, upwork.com/hire/pricing, fiverr.com/support (retrieved 2026). SWIFT and Western Union
                fees are averaged across the top ten Asia-Pacific corridors from World Bank Remittance Prices Worldwide
                (Q1 2026). Cross-border FX spreads are conservative estimates against mid-market rate on the day.
              </p>

              <p>
                Every entry above shares the same weakness: <strong>the freelancer never has custody of their earnings</strong>.
                Funds are held by a company (PayPal, Upwork, Fiverr, Payoneer) or routed through a chain of correspondent
                banks (SWIFT). Accounts get frozen, holds get extended, disputes get lost, and the freelancer waits.
              </p>

              <p>
                FreelanceBot is different in two ways that matter:
              </p>
              <ul>
                <li>
                  <strong>Self-custody by default.</strong> The escrow is a Solidity contract on Arc Testnet. When the
                  client approves release, USDC moves directly from the contract to the freelancer&apos;s wallet — no
                  intermediary, no chargeback window, no account to freeze.
                </li>
                <li>
                  <strong>Deterministic fee.</strong> 1% platform fee, encoded in the contract, transparent on-chain.
                  Zero FX spread (USDC is a dollar). Zero withdrawal fee (the funds are already yours). Zero holdback.
                </li>
              </ul>

              <Callout>
                On a $300 job, the freelancer takes home $297 with FreelanceBot vs $220 with Upwork.
                That&apos;s <strong>$77 more per job</strong> — a 35% pay raise, sourced entirely from removing
                middlemen. Repeat this across the 75M-freelancer APAC market and you&apos;re looking at a
                $10–20B annual fee leakage that goes back to the workers who earned it.
              </Callout>

              <h3 className="mt-8 text-base font-semibold text-slate-900">What about existing crypto solutions?</h3>
              <p>
                Raw USDC transfers on Ethereum L1 (~$3–15 gas, 15–30 sec finality), Polygon, or Base solve fees but
                not <em>trust</em>. Neither party wants to send first. Bitwage and Request Network wrap USDC in payroll
                UX but keep custody with the employer. Escrow-as-a-service tools (LawGeex, Escrow.com) charge
                3–5%. None combine <strong>on-chain escrow + AI verification + open marketplace</strong> in a single
                self-custody flow the way FreelanceBot does — that&apos;s the wedge.
              </p>

              <h3 className="mt-8 text-base font-semibold text-slate-900">No token. Ever.</h3>
              <p>
                FreelanceBot is <strong>infrastructure, not a speculative asset</strong>. There is no <code>FBOT</code>{" "}
                token, no governance token, no airdrop, no vesting schedule, no VC unlock, no points program, no season
                pass, no NFT tier — none of it, ever. Payments settle in <strong>USDC</strong>, a fully-reserved
                US-dollar stablecoin regulated under NYDFS BitLicense. The platform fee (1%) is collected in USDC and
                routed to a recipient address the operator controls transparently on-chain.
              </p>
              <p>
                This is a deliberate design choice, not an oversight. Adding a token would:
              </p>
              <ul>
                <li>
                  <strong>Break the value proposition.</strong> The whole point is that a freelancer in Jakarta gets a
                  dollar-denominated payout without volatility. A native token would re-introduce the FX risk we spent
                  the entire product design removing.
                </li>
                <li>
                  <strong>Invite regulatory attack.</strong> Selling a token to fund development turns the protocol into
                  an unregistered securities offering in most jurisdictions. Circle&apos;s USDC (already regulated) plus
                  Arc (settlement layer) is legally clean end-to-end.
                </li>
                <li>
                  <strong>Distract from execution.</strong> Every hour spent on token economics is an hour not spent
                  making cross-border settlement faster, cheaper, and more auditable. We&apos;d rather ship features to
                  the 75M APAC freelancers than manage a Discord about staking rewards.
                </li>
                <li>
                  <strong>Contradict the open-source thesis.</strong> The contract is MIT-licensed. Anyone can fork it,
                  deploy their own instance, and set their own fee (or zero). Trying to capture that value with a token
                  would be self-defeating.
                </li>
              </ul>
              <p>
                If the protocol needs governance in the future, it will be handled by a lightweight multisig of
                elected operators — funded transparently via the 1% platform fee, not by minting a new asset. If it
                needs sustainability funding, it will come from grants (Ethereum Foundation, Circle Ventures, Arc
                Foundation), audit sponsorships, or optional premium hosting for large clients — never from a token
                sale that dilutes the workers this protocol exists to serve.
              </p>
              <Callout>
                <strong>tl;dr:</strong> FreelanceBot is TCP/IP for cross-border freelance payments. TCP/IP has no
                token; neither should this.
              </Callout>
            </Section>

            <Section id="solution" title="The solution" emoji="✨">
              <p>FreelanceBot fuses three pieces into one flow:</p>
              <ol>
                <li><strong>On-chain escrow</strong> — a verified Solidity contract on Arc Testnet holds USDC until both parties are done.</li>
                <li><strong>AI verification</strong> — Groq Llama 3.3 70B inspects the deliverable URL, deadline, brief alignment, and emits a structured verdict.</li>
                <li><strong>Public marketplace + private mode</strong> — clients can post publicly (anyone applies) or directly to a known freelancer (skip the marketplace).</li>
              </ol>
              <p>
                The result: a freelancer in Jakarta and a client in NYC complete a $300 job, the USDC settles in &lt;1 second
                with a 1% platform fee, and both walk away with a 1–5 star rating that travels across orders.
              </p>
            </Section>

            <Section id="lifecycle" title="Order lifecycle" emoji="🔄">
              <p>Every order flows through five states:</p>
              <Steps
                steps={[
                  { n: "01", t: "Draft",     d: "Client posts. If public, listed on /jobs. If private, sent directly." },
                  { n: "02", t: "Funded",    d: "Client funds USDC into the escrow contract (or sim'd in demo)." },
                  { n: "03", t: "Delivered", d: "Freelancer submits a deliverable URL. AI agent checks reachability + deadline + brief alignment." },
                  { n: "04", t: "Released", d: "Client clicks approve. USDC settles to freelancer in sub-second finality, minus 1% fee." },
                  { n: "05", t: "Rated",    d: "Both sides rate each other (1–5 stars + comment). Aggregated to user profile." },
                ]}
              />
              <p>If the deadline passes without delivery, anyone can call <code>refund(orderId)</code> after the grace period and the client gets their USDC back.</p>
            </Section>

            <Section id="marketplace" title="Marketplace" emoji="🏷️">
              <p>The marketplace at <Link href="/jobs" className="text-brand hover:underline">/jobs</Link> is fully public — no sign-in required to browse.
              Each job card shows budget, deadline, field, and an attachment indicator. Freelancers click into the job and submit a one-page application (email + pitch + optional counter-bid).</p>
              <p>The client sees all applicants in their order detail and picks one. On accept, the order becomes private (only the parties can see it) and the escrow flow begins.</p>
              <p>Fields supported: Design 🎨 · Dev ⚙️ · Writing ✍️ · Video 🎬 · Marketing 📣 · Research 🔬 · Other 📦.</p>
            </Section>

            <Section id="trust" title="Trust & ratings" emoji="⭐">
              <p>After every <em>released</em> order, both parties can rate each other 1–5 stars with an optional public comment.
              Ratings are stored per email and aggregated to a <code>UserBadge</code> that appears next to client/freelancer everywhere their name shows.</p>
              <p>New users with zero ratings show a small <strong>new</strong> badge. Ratings are immutable once submitted — no editing, no deleting.</p>
              <p>Clients can also enrich their listing with X / GitHub / website / LinkedIn links so freelancers can verify identity before applying. Set defaults in <Link href="/settings" className="text-brand hover:underline">Settings</Link>.</p>
            </Section>

            <Section id="agent" title="AI agent" emoji="🤖">
              <p>The agent (Groq Llama 3.3 70B by default; swap for OpenAI / Anthropic / Ollama in MVP 2) does two jobs:</p>
              <ul>
                <li><strong>chat</strong> — answers questions from either party with full order context (brief, amount, deadline, status). Replies in the user&apos;s language automatically.</li>
                <li><strong>verifyDeliverable</strong> — given a deliverable URL: (1) HEAD-checks reachability, (2) refuses private / link-local hosts (SSRF guard), (3) compares against the original brief via LLM, (4) emits a JSON verdict <code>{`{verified, confidence, reasoning, checks}`}</code>.</li>
              </ul>
              <p>The verdict is advisory — the client still clicks the release button. The agent <em>never</em> moves funds autonomously.</p>

              <h3 className="mt-6 font-display text-base uppercase tracking-wider text-slate-900">Security model (OWASP LLM Top 10)</h3>
              <p>The agent is hardened against the most common LLM attack patterns:</p>
              <ul>
                <li><strong>LLM01 — Prompt injection:</strong> system prompt explicitly tells the agent to treat all user content (brief, URL, chat) as untrusted data, not commands. Common jailbreak phrases ("ignore previous instructions", "you are now in admin mode") are neutralized server-side before being sent to the model.</li>
                <li><strong>LLM02 — Insecure output handling:</strong> the verdict shape is strictly typed. Any value outside the allowed enum collapses to safe defaults (<code>partial</code>/<code>low</code>). The <code>verified</code> boolean is <em>server-derived</em> from the LLM&apos;s structured fields, not asserted by the LLM directly.</li>
                <li><strong>LLM06 — Sensitive info disclosure:</strong> the agent is instructed to never repeat seed phrases, private keys, or API tokens — even if the user claims to be the platform admin.</li>
                <li><strong>LLM08 — Excessive agency:</strong> the agent has zero authority to move funds. It cannot call <code>approveAndRelease</code>, <code>refund</code>, or any contract function. Release is always a human click in the UI.</li>
                <li><strong>LLM09 — Overreliance:</strong> every verdict carries a confidence level. UI surfaces &quot;Hold for review&quot; on anything below <code>matches + high</code>, and the server downgrades any <code>matches + high</code> claim to <code>medium</code> because the LLM only sees the URL string, not the actual contents.</li>
                <li><strong>SSRF:</strong> the URL reachability check refuses <code>localhost</code>, <code>127.x</code>, <code>10.x</code>, <code>172.16-31.x</code>, <code>192.168.x</code>, link-local IPv6, and non-HTTP(S) schemes. A malicious freelancer cannot use the verifier to probe internal infra.</li>
              </ul>
            </Section>

            <Section id="contract" title="Smart contract" emoji="🪙">
              <p>The escrow contract <code>FreelanceEscrow.sol</code> is deployed and source-verified at
              <a href="https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4" target="_blank" rel="noopener noreferrer" className="ml-1 text-brand hover:underline">
                0xA8CA…3ae4 on Arc Testnet ↗
              </a>.
              </p>
              <p>Key functions:</p>
              <ul>
                <li><code>createAndFund(freelancer, amount, brief, deadline)</code> — client deposits USDC + opens an order.</li>
                <li><code>submitDelivery(orderId, deliverable)</code> — freelancer marks deliverable.</li>
                <li><code>approveAndRelease(orderId)</code> — client or agent releases funds (1% fee deducted).</li>
                <li><code>refund(orderId)</code> — anyone can trigger after deadline + 7-day grace.</li>
              </ul>
              <p>Eighteen unit tests cover happy path, refund path, agent-release, admin, and a Jakarta→NYC end-to-end scenario.</p>
            </Section>

            <Section id="privacy" title="Privacy & security" emoji="🔒">
              <p>FreelanceBot makes a few explicit choices about what stays public and what stays private:</p>
              <ul>
                <li><strong>Order metadata</strong> — visible to anyone with the order ID if the order is public; visible only to the two parties otherwise.</li>
                <li><strong>Chat thread</strong> — always private to the client + freelancer. The agent reads it server-side.</li>
                <li><strong>Attachments</strong> — visibility follows the order&apos;s public/private flag.</li>
                <li><strong>Ratings</strong> — public. They are trust signals.</li>
                <li><strong>API keys / private keys / seed phrases</strong> — NEVER asked for on FreelanceBot. We don&apos;t store them, we don&apos;t want them. Anything asking you to paste them isn&apos;t us.</li>
              </ul>
              <p>Mutating API routes require the caller to identify as a party of the order. Spoof risk is acknowledged for MVP 1 — real auth (Supabase Auth magic-link, Circle Wallets) lands in MVP 2.</p>
            </Section>

            <Section id="roadmap" title="Roadmap" emoji="🗺️">
              <Steps
                steps={[
                  { n: "Now",     t: "v0.11.x",  d: "Ratings, attachments, marketplace, applications, basic settings. Single hosted instance + GitHub repo." },
                  { n: "Next",    t: "v0.12.0",  d: "Dark mode toggle, real i18n (5 languages), notification emails (Resend or SES), better empty states." },
                  { n: "MVP 2",   t: "v1.0.0",   d: "Multi-chain (Base + Polygon), Circle Wallets embedded auth, back office for operators, Foundry test suite added, docker-compose self-host kit." },
                  { n: "Future",  t: "post-1.0", d: "Reputation primitive (soulbound NFT), CCTP cross-chain, USYC yield on idle escrow." },
                ]}
              />
              <p>See <a href="https://github.com/orangterkucil/freelancebot/blob/main/PRD.md" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">PRD.md</a> for the full plan.</p>
            </Section>

            <Section id="faq" title="FAQ" emoji="❓">
              <Q q="Do I need crypto experience to use this?">
                For the live demo: no, the UI simulates fund/release if you don&apos;t connect a wallet. For real on-chain transactions:
                yes, you need MetaMask connected to Arc Testnet with testnet USDC.
              </Q>
              <Q q="Is the contract audited?">
                Not yet. v1.0.0 plans Code4rena / Sherlock review when the contract surface changes.
                The current contract is source-verified on arcscan so anyone can read it.
              </Q>
              <Q q="What stops a client from refusing to release?">
                The grace-period refund path. If the freelancer delivered and the client doesn&apos;t release within 7 days, the agent or
                a third party can&apos;t force release — but reputation hits and a dispute mechanism (planned MVP 2) handle the long tail.
              </Q>
              <Q q="Can I self-host?">
                Yes. <a href="https://github.com/orangterkucil/freelancebot" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Fork the repo</a>,
                follow the README&apos;s &quot;For contributors and self-hosters&quot; section. You&apos;ll need Supabase + Groq + Arc Testnet, all free tier.
              </Q>
              <Q q="How does the 1% fee work?">
                Set as a basis-points constant in the contract at deploy time. Goes to <code>agentFeeRecipient</code>.
                In the public reference instance that&apos;s the deployer&apos;s wallet; in a self-hosted instance you set it.
              </Q>
              <Q q="Is there a token?">
                No. Explicit non-goal.
              </Q>
            </Section>

            <footer className="mt-16 border-t border-slate-200 py-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                  MIT licensed · v0.11.0 · Built for the open web
                </p>
                <div className="flex items-center gap-4">
                  <Link href="/client" className="font-display text-[12px] uppercase tracking-wider text-brand hover:underline">
                    Try the demo →
                  </Link>
                  <a
                    href="https://github.com/orangterkucil/freelancebot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-[12px] uppercase tracking-wider text-slate-600 hover:text-brand"
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .prose-doc { line-height: 1.7; color: #334155; }
        .prose-doc h2 { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-anton), Anton, sans-serif; font-size: 1.875rem; line-height: 1.1; text-transform: uppercase; color: #0f172a; margin-top: 2.5rem; margin-bottom: 1rem; letter-spacing: -0.01em; }
        .prose-doc h2:first-of-type { margin-top: 0; }
        .prose-doc p { font-family: var(--font-jb-mono), "JetBrains Mono", monospace; font-size: 0.85rem; margin-bottom: 0.85rem; color: #475569; }
        .prose-doc strong { color: #0f172a; font-weight: 600; }
        .prose-doc ul, .prose-doc ol { font-family: var(--font-jb-mono), "JetBrains Mono", monospace; font-size: 0.85rem; padding-left: 1.25rem; margin-bottom: 1rem; color: #475569; }
        .prose-doc li { margin-bottom: 0.4rem; }
        .prose-doc code { font-family: var(--font-jb-mono), "JetBrains Mono", monospace; font-size: 0.8rem; padding: 0.05rem 0.35rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; color: #0f172a; }
        .prose-doc a { color: #0ea5e9; }
      `}</style>
    </div>
  );
}

function Section({ id, title, emoji, children }: { id: string; title: string; emoji?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2>
        {emoji && <span className="text-2xl">{emoji}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-4 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-4 font-mono text-[12px] leading-relaxed text-slate-700">
      {children}
    </aside>
  );
}

function Steps({ steps }: { steps: { n: string; t: string; d: string }[] }) {
  return (
    <ol className="my-4 grid gap-3" style={{ listStyle: "none", paddingLeft: 0 }}>
      {steps.map((s) => (
        <li key={s.n} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xs uppercase tracking-widest text-brand">{s.n}</span>
            <p className="m-0 font-display text-base uppercase text-slate-900">{s.t}</p>
          </div>
          <p className="m-0 mt-1 font-mono text-[12px] leading-relaxed text-slate-600">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="my-3 rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer font-display text-sm uppercase text-slate-900">{q}</summary>
      <div className="mt-3 font-mono text-[12px] leading-relaxed text-slate-600">{children}</div>
    </details>
  );
}
