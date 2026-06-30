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
                <li><strong>verifyDeliverable</strong> — given a deliverable URL: (1) HEAD-checks reachability, (2) compares against the original brief via LLM, (3) emits a JSON verdict <code>{`{verified, confidence, reasoning, checks}`}</code>.</li>
              </ul>
              <p>The verdict is advisory — the client still clicks the release button. The agent <em>never</em> moves funds autonomously.</p>
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
