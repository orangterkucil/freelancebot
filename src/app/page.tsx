"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Github,
  Mail,
  Twitter,
  Wallet,
  Sparkles,
  CircleCheckBig,
} from "lucide-react";
import { LiveJobsPreview } from "@/components/LiveJobsPreview";
import { LangPicker } from "@/components/LangPicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/lib/i18n";

/**
 * Landing page — v0.10.0 "putih + biru" light theme.
 *
 * Reverted from the dark luxe Orbis aesthetic back to a clean fintech
 * palette: white surfaces, brand-blue accent, slate text. App routes
 * (/client, /freelancer, /jobs, /orders) match this theme — no more
 * jarring transition at app boundary.
 */
export default function Home() {
  return (
    <div className="bg-slate-50 text-slate-900 antialiased">
      <HeroSection />
      <AboutSection />
      <FlowSection />
      <LiveJobsPreview />
      <CtaSection />

      <footer className="border-t border-slate-200 bg-white py-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
          MIT licensed · Open source · v0.13.0 ·{" "}
          <a
            href="https://github.com/orangterkucil/freelancebot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-brand"
          >
            GitHub
          </a>{" "}
          ·{" "}
          <Link href="/docs" className="text-slate-600 hover:text-brand">
            Docs
          </Link>
        </p>
      </footer>
    </div>
  );
}

/* ===================================================================== *
 *  SECTION 1 — HERO                                                     *
 * ===================================================================== */
function HeroSection() {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden rounded-b-[32px] bg-space">
      <div className="relative mx-auto max-w-landing px-6 pb-20 pt-4 lg:px-12 lg:pt-5">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo-mark.svg"
              alt="FreelanceBot"
              width={40}
              height={40}
              priority
              className="drop-shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="font-display text-base uppercase tracking-wider text-slate-900">
                FreelanceBot
              </span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-brand">
                payouts · on arc
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <nav className="rounded-full border border-slate-200 bg-white/90 px-6 py-2.5 shadow-sm backdrop-blur">
              <ul className="flex items-center gap-6">
                {[
                  { href: "#flow",   label: t("nav.howItWorks") },
                  { href: "#about",  label: t("nav.about") },
                  { href: "/client", label: t("nav.demo") },
                  { href: "/jobs",   label: t("nav.marketplace") },
                  { href: "/docs",   label: t("nav.docs") },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="font-display text-[12px] uppercase tracking-wider text-slate-700 transition-colors hover:text-brand"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <LangPicker />
            <ThemeToggle compact />

            <div className="flex items-center gap-1.5">
              {[
                { Icon: Twitter, href: "https://x.com/geografinist", label: "X" },
                { Icon: Github,  href: "https://github.com/orangterkucil/freelancebot", label: "GitHub" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </header>

        <div className="relative mt-14 lg:mt-20 lg:ml-32">
          <h1 className="font-display text-[40px] uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-[75px] lg:text-[90px] lg:leading-[1] max-w-[820px] text-slate-900">
            {t("hero.line1")}
            <br />
            {t("hero.line2")}&nbsp;
            <span className="text-slate-500">(&nbsp;{t("hero.line3")}&nbsp;)</span>
            &nbsp;{t("hero.line4")}
          </h1>

          <span
            aria-hidden
            className="font-script absolute right-0 top-2 -rotate-1 text-2xl text-brand opacity-90 sm:text-3xl md:text-4xl lg:right-12 lg:text-5xl"
          >
            {t("hero.script")}
          </span>

          <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-slate-600 sm:text-base">
            {t("hero.subtitle1")}
            <br className="hidden sm:block" />
            {t("hero.subtitle2")}
          </p>

          {/* Built on Arc — official logo, links to arc.io (brand-compliant credential) */}
          <a
            href="https://www.arc.io"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Built on Arc"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 shadow-sm backdrop-blur transition-colors hover:border-brand"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Built on
            </span>
            <img src="/arc-logo.webp" alt="Arc" className="inline h-3.5 w-auto align-middle dark:hidden" />
            <img src="/arc-logo-ondark.svg" alt="Arc" className="hidden h-3.5 w-auto align-middle dark:inline-block" />
          </a>

          {/* Concrete before/after number contrast */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm backdrop-blur sm:max-w-xl sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-rose-600">Before</span>
              <span className="mt-1 block font-display text-lg text-slate-500 line-through decoration-rose-400 sm:text-xl">
                $220 in 14 days
              </span>
            </div>
            <ArrowRight className="hidden h-5 w-5 text-brand sm:block" />
            <div className="flex-1">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-emerald-600">After</span>
              <span className="mt-1 block font-display text-lg text-slate-900 sm:text-xl">
                <span className="text-emerald-600">$297</span> in <span className="text-emerald-600">0.8 seconds</span>
              </span>
            </div>
          </div>

          {/* Live activity ticker */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-slate-500 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-emerald-700">Arc Testnet · live</span>
            </span>
            <span>Contract <span className="text-slate-700">0xA8CA…3ae4</span> verified</span>
            <span>Groq Llama 3.3 70B · online</span>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/client"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.02]"
            >
              {t("hero.cta.demo")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-display text-sm uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-brand hover:text-brand"
            >
              <Sparkles className="h-4 w-4" />
              {t("hero.cta.docs")}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: "<1s",   l: t("stats.arcFinality") },
              { v: "1%",    l: t("stats.platformFee") },
              { v: "75M+",  l: t("stats.asiaFreelancers") },
              { v: "$0",    l: t("stats.vcRaised") },
            ].map((s) => (
              <div key={s.l} className="border-l border-slate-200 pl-3">
                <p className="font-display text-2xl text-brand sm:text-3xl">{s.v}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-3 lg:hidden">
          {[
            { Icon: Mail,    href: "mailto:orangterkucil@gmail.com" },
            { Icon: Twitter, href: "https://x.com/geografinist" },
            { Icon: Github,  href: "https://github.com/orangterkucil/freelancebot" },
          ].map(({ Icon, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== *
 *  SECTION 2 — ABOUT (bento grid — three perspectives)                  *
 * ===================================================================== */
function AboutSection() {
  return (
    <section id="about" className="relative bg-white py-20 sm:py-28 lg:py-32">
      <div className="relative mx-auto max-w-landing px-6 lg:px-12">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="h-1 w-1 rounded-full bg-brand" />
            Why FreelanceBot
          </span>
          <h2 className="mt-4 font-display text-[32px] uppercase leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[54px]">
            One escrow.<br className="sm:hidden" />
            <span className="font-script text-brand"> three sides</span> served.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-mono text-sm leading-relaxed text-slate-600">
            Built for the 75M+ freelancers in Asia-Pacific who lose 18% of every gig to PayPal, SWIFT, and Upwork —
            and for the clients + agents who make that flow possible.
          </p>
        </div>

        {/* Bento grid — 3 stakeholder cards */}
        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {/* Freelancer card */}
          <div className="group relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm sm:p-8">
            <div className="absolute right-4 top-4 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-emerald-800">
              For freelancers
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-700">Net income</p>
            <p className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
              <span className="text-emerald-600">+$77</span>
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">per $300 job vs Upwork+SWIFT</p>
            <div className="mt-6 space-y-2 font-mono text-[11px] leading-relaxed text-slate-700">
              <p>✓ Sub-second payout on release</p>
              <p>✓ USDC in your wallet — self-custody</p>
              <p>✓ AI agent verifies your delivery for you</p>
              <p>✓ Ratings + social credibility follow you</p>
            </div>
          </div>

          {/* Client card */}
          <div className="group relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            <div className="absolute right-4 top-4 rounded-full bg-sky-100 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-sky-800">
              For clients
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sky-700">Time to hire</p>
            <p className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
              <span className="text-sky-600">3 min</span>
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">post → applicants → funded escrow</p>
            <div className="mt-6 space-y-2 font-mono text-[11px] leading-relaxed text-slate-700">
              <p>✓ Post publicly or send directly</p>
              <p>✓ USDC locked until you approve release</p>
              <p>✓ Refund path after grace period</p>
              <p>✓ Applicant trust score inline</p>
            </div>
          </div>

          {/* AI Agent card */}
          <div className="group relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            <div className="absolute right-4 top-4 rounded-full bg-violet-100 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-violet-800">
              For the AI agent
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-violet-700">Attack surface</p>
            <p className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
              <span className="text-violet-600">OWASP</span>
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">LLM Top-10 hardened</p>
            <div className="mt-6 space-y-2 font-mono text-[11px] leading-relaxed text-slate-700">
              <p>✓ Prompt injection defense</p>
              <p>✓ Server-derived verdict (not LLM-asserted)</p>
              <p>✓ SSRF guard on URL checks</p>
              <p>✓ 18-case Solidity test suite</p>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-10 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-4 sm:gap-6">
          {[
            { v: "$500B+", l: "APAC freelance flow / year" },
            { v: "$10–20B", l: "Annual fee leakage" },
            { v: "<1 sec",  l: "Arc finality" },
            { v: "MIT",     l: "Forever open source" },
          ].map((s) => (
            <div key={s.l} className="border-l-2 border-brand pl-3">
              <p className="font-display text-xl text-slate-900 sm:text-2xl">{s.v}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-500 sm:text-[10px]">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== *
 *  SECTION 3 — LIVE FLOW                                                *
 * ===================================================================== */
function FlowSection() {
  const steps = [
    {
      Icon: Wallet,
      title: "Client funds",
      desc: "Approve + createAndFund call the on-chain escrow. USDC is locked on Arc in one signed transaction.",
      kpi:  "≈ 5–10 sec",
      kpiLabel: "Tx confirmation",
      href: "/client",
    },
    {
      Icon: Sparkles,
      title: "Agent verifies",
      desc: "Groq Llama 3.3 70B checks URL reachability, deadline match, and brief alignment. Structured JSON verdict.",
      kpi:  "≈ 3–8 sec",
      kpiLabel: "Verdict latency",
      href: "/freelancer",
    },
    {
      Icon: CircleCheckBig,
      title: "Freelancer paid",
      desc: "approveAndRelease emits OrderReleased. USDC settles to the freelancer in sub-second finality on Arc.",
      kpi:  "< 1 sec",
      kpiLabel: "Arc finality",
      href: "/freelancer",
    },
  ];

  return (
    <section id="flow" className="relative bg-slate-50 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-landing px-6 lg:px-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[32px] uppercase leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[60px]">
            How it
            <br className="lg:hidden" />
            <span className="ml-12 sm:ml-24 lg:ml-32">
              <span className="font-script text-brand opacity-90">actually</span>{" "}
              works
            </span>
          </h2>

          <Link href="/client" className="group block">
            <div className="flex items-end gap-3">
              <span className="font-display text-3xl uppercase tracking-wider text-slate-900 sm:text-5xl lg:text-[60px]">
                Run
              </span>
              <div className="flex flex-col">
                <span className="font-display text-xl uppercase tracking-wider text-slate-700 sm:text-2xl lg:text-3xl">
                  the
                </span>
                <span className="font-display text-xl uppercase tracking-wider text-slate-700 sm:text-2xl lg:text-3xl">
                  demo
                </span>
              </div>
              <ArrowRight className="ml-1 mb-1 h-6 w-6 text-slate-900 transition-transform group-hover:translate-x-1 sm:h-8 sm:w-8" />
            </div>
            <div className="mt-3 h-1.5 w-full bg-brand sm:h-2 lg:h-2.5" />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, idx) => (
            <Link
              key={s.title}
              href={s.href}
              className="liquid-glass group block rounded-[32px] p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-sky-50 via-white to-slate-50">
                <div className="absolute inset-8 rounded-full border border-slate-200" />
                <div className="absolute inset-16 rounded-full border border-slate-200" />
                <div
                  className="absolute h-2 w-2 animate-flow rounded-full bg-brand shadow-[0_0_16px_rgba(14,165,233,0.5)]"
                  style={{ top: `${20 + idx * 20}%`, left: `${30 + idx * 15}%` }}
                />
                <span className="absolute left-5 top-4 font-display text-[11px] uppercase tracking-widest text-slate-400">
                  Step {String(idx + 1).padStart(2, "0")}
                </span>
                <s.Icon className="h-20 w-20 text-slate-500 transition-transform group-hover:scale-110" strokeWidth={1.2} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white px-5 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                    {s.kpiLabel}
                  </p>
                  <p className="font-display text-base uppercase text-slate-900">{s.kpi}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark shadow-md shadow-brand/40 transition-transform group-hover:scale-110">
                  <ChevronRight className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
              </div>

              <div className="mt-4 px-1">
                <p className="font-display text-2xl uppercase text-slate-900">{s.title}</p>
                <p className="mt-2 font-mono text-[11px] uppercase leading-relaxed text-slate-500">
                  {s.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== *
 *  SECTION 4 — CTA                                                      *
 * ===================================================================== */
function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-space py-24 sm:py-28 lg:py-36">
      <div className="relative mx-auto grid max-w-landing grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[auto_1fr] lg:gap-24 lg:px-12">
        <div className="mx-auto w-fit flex-shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:mx-0">
          {[
            { Icon: Mail,    href: "mailto:orangterkucil@gmail.com", label: "Email" },
            { Icon: Twitter, href: "https://x.com/geografinist",      label: "Twitter" },
            { Icon: Github,  href: "https://github.com/orangterkucil/freelancebot", label: "GitHub" },
          ].map(({ Icon, href, label }, i, arr) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={
                "grid h-16 w-16 place-items-center text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand" +
                (i < arr.length - 1 ? " border-b border-slate-200" : "")
              }
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        <div className="relative max-w-2xl text-left lg:text-right">
          <span
            aria-hidden
            className="font-script mb-2 block text-3xl text-brand sm:text-4xl lg:text-5xl"
          >
            Go beyond
          </span>

          <h2 className="font-display text-[32px] uppercase leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[64px]">
            <span className="block">Join us.</span>
            <span className="block">Fork the repo.</span>
            <span className="block">Ship your own.</span>
            <span className="block">Follow the signal.</span>
          </h2>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/client"
              className="group btn-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-sm uppercase tracking-wider"
            >
              <Sparkles className="h-4 w-4" />
              Try live demo
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-display text-sm uppercase tracking-wider text-slate-700 transition-colors hover:border-brand hover:text-brand"
            >
              Read the docs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
