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
          MIT licensed · Open source · v0.11.0 ·{" "}
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
                  { href: "#flow",   label: "How it works" },
                  { href: "#about",  label: "About" },
                  { href: "/client", label: "Demo" },
                  { href: "/jobs",   label: "Marketplace" },
                  { href: "/docs",   label: "Docs" },
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
          <h1 className="font-display text-[40px] uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-[75px] lg:text-[90px] lg:leading-[1] max-w-[780px] text-slate-900">
            Get paid the
            <br />
            moment&nbsp;
            <span className="text-slate-500">(&nbsp;you&nbsp;)</span>
            &nbsp;deliver.
          </h1>

          <span
            aria-hidden
            className="font-script absolute right-0 top-2 -rotate-1 text-2xl text-brand opacity-90 sm:text-3xl md:text-4xl lg:right-12 lg:text-5xl"
          >
            agentic payouts
          </span>

          <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-slate-600 sm:text-base">
            USDC escrow on Arc. AI agent verifies deliverables.
            <br className="hidden sm:block" />
            Sub-second settlement. Open source. MIT licensed.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/client"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-display text-sm uppercase tracking-wider text-white shadow-sm shadow-brand/30 transition-transform hover:scale-[1.02]"
            >
              Open live demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-display text-sm uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-brand hover:text-brand"
            >
              <Sparkles className="h-4 w-4" />
              Read the docs
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: "<1s",   l: "Arc finality" },
              { v: "1%",    l: "Platform fee" },
              { v: "75M+",  l: "Asia freelancers" },
              { v: "$0",    l: "VC raised" },
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
 *  SECTION 2 — ABOUT                                                    *
 * ===================================================================== */
function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-white py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/50" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-orbit rounded-full bg-brand shadow-[0_0_24px_rgba(14,165,233,0.6)]" />

      <div className="relative mx-auto max-w-landing px-6 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative">
            <h2 className="font-display text-[32px] uppercase leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[60px]">
              Hello.
              <br />
              I&apos;m FreelanceBot.
            </h2>
            <span
              aria-hidden
              className="font-script absolute -bottom-2 right-0 rotate-[-3deg] text-3xl text-brand opacity-90 sm:text-5xl lg:text-[68px]"
            >
              open source
            </span>
          </div>

          <p className="max-w-md font-mono text-sm leading-relaxed text-slate-600 sm:text-base lg:max-w-[280px]">
            Built for the 75 million freelancers in Asia-Pacific who lose 18% of every gig
            to PayPal, SWIFT, and Upwork.
          </p>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "$500B+", l: "Asia freelance flow / year",  k: "market" },
            { v: "$10-20B", l: "Annual fee leakage",         k: "problem" },
            { v: "<1 sec",  l: "Arc finality time",          k: "speed" },
            { v: "MIT",     l: "Forever open source",        k: "license" },
          ].map((s) => (
            <div key={s.k} className="liquid-glass rounded-2xl p-5">
              <p className="font-display text-3xl text-slate-900 sm:text-4xl">{s.v}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
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
