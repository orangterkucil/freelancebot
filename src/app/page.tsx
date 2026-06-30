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

/**
 * Landing page — Orbis-inspired dark luxe redesign (v0.7.0).
 *
 * Pivots the previous clean-modern hero into a four-section dark space landing
 * with Anton/Condiment fonts, liquid-glass surfaces, and a signal-green accent
 * (#00D18C — chosen over #6FFF00 because money-green > highlighter-green for a
 * payment product). Replaces all CloudFront video backgrounds with pure CSS
 * gradients + decorative stars so the page stays under ~200 KB on first paint
 * (target: emerging-market 3G).
 *
 * The app routes (/client, /freelancer, /orders) intentionally keep their
 * light theme — payment surfaces stay clean & trustworthy. Only / lives here.
 */
export default function Home() {
  return (
    <div className="bg-ink text-cream antialiased selection:bg-signal selection:text-ink">
      {/* Global texture overlay (CSS noise; no PNG required) */}
      <div className="texture-overlay pointer-events-none fixed inset-0 z-50" />

      <HeroSection />
      <AboutSection />
      <FlowSection />
      <CtaSection />

      <footer className="border-t border-white/5 bg-ink py-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-cream/40">
          MIT licensed · Open source ·{" "}
          <a
            href="https://github.com/orangterkucil/freelancebot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/60 hover:text-signal"
          >
            github.com/orangterkucil/freelancebot
          </a>
        </p>
      </footer>
    </div>
  );
}

/* =====================================================================
 *  SECTION 1 — HERO
 * ===================================================================== */

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden rounded-b-[32px] bg-space">
      <div className="absolute inset-0 bg-stars opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/40 to-ink" />

      <div className="relative mx-auto max-w-landing px-6 pb-24 pt-8 lg:px-12 lg:pt-10">
        <header className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-display text-base uppercase tracking-wider text-cream">
              FreelanceBot
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cream/60 group-hover:text-signal">
              v0.7.0
            </span>
          </Link>

          {/* Nav */}
          <nav className="liquid-glass hidden rounded-[28px] px-[52px] py-[18px] lg:block">
            <ul className="flex items-center gap-10">
              {[
                { href: "#flow",   label: "How it works" },
                { href: "#about",  label: "About" },
                { href: "/client", label: "Demo" },
                { href: "https://github.com/orangterkucil/freelancebot/blob/main/PRD.md", label: "PRD" },
                { href: "https://github.com/orangterkucil/freelancebot", label: "GitHub" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="font-display text-[13px] uppercase tracking-wider text-cream/90 transition-colors hover:text-signal"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social icons — desktop, vertical stack top-right */}
          <div className="hidden flex-col gap-2 lg:flex">
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
                className="liquid-glass grid h-12 w-12 place-items-center rounded-2xl transition-colors hover:bg-white/10"
              >
                <Icon className="h-5 w-5 text-cream" />
              </a>
            ))}
          </div>
        </header>

        {/* Hero content */}
        <div className="relative mt-20 lg:mt-32 lg:ml-32">
          <h1 className="font-display text-[40px] uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-[75px] lg:text-[90px] lg:leading-[1] max-w-[780px]">
            Get paid the
            <br />
            moment&nbsp;
            <span className="text-cream/80">(&nbsp;you&nbsp;)</span>
            &nbsp;deliver.
          </h1>

          {/* Cursive accent */}
          <span
            aria-hidden
            className="font-script absolute right-0 top-2 -rotate-1 text-2xl text-signal opacity-90 mix-blend-exclusion sm:text-3xl md:text-4xl lg:right-12 lg:text-5xl"
          >
            agentic payouts
          </span>

          {/* Subhead */}
          <p className="mt-8 max-w-xl font-mono text-sm uppercase leading-relaxed tracking-wide text-cream/70 sm:text-base">
            USDC escrow on Arc. AI agent verifies deliverables.
            <br className="hidden sm:block" />
            Sub-second settlement. Open source. MIT licensed.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/client"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-signal px-6 py-4 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.02]"
            >
              Open live demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://github.com/orangterkucil/freelancebot"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-sm uppercase tracking-wider text-cream transition-colors hover:bg-white/10"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: "<1s",   l: "Arc finality" },
              { v: "1%",    l: "Platform fee" },
              { v: "75M+",  l: "Asia freelancers" },
              { v: "$0",    l: "VC raised" },
            ].map((s) => (
              <div key={s.l} className="border-l border-white/10 pl-3">
                <p className="font-display text-2xl text-signal sm:text-3xl">{s.v}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-cream/50">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Social icons — mobile center */}
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
              className="liquid-glass grid h-12 w-12 place-items-center rounded-2xl"
            >
              <Icon className="h-5 w-5 text-cream" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 *  SECTION 2 — ABOUT
 * ===================================================================== */

function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-ink py-20 sm:py-28 lg:py-32">
      {/* Faint orbital decoration */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.02]" />
      {/* Orbiting signal-green dot */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-orbit rounded-full bg-signal shadow-[0_0_24px_rgba(0,209,140,0.7)]" />

      <div className="relative mx-auto max-w-landing px-6 lg:px-12">
        {/* Top row */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative">
            <h2 className="font-display text-[32px] uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-[60px]">
              Hello.
              <br />
              I&apos;m FreelanceBot.
            </h2>
            <span
              aria-hidden
              className="font-script absolute -bottom-2 right-0 rotate-[-3deg] text-3xl text-signal opacity-90 mix-blend-exclusion sm:text-5xl lg:text-[68px]"
            >
              open source
            </span>
          </div>

          <p className="max-w-md font-mono text-sm uppercase leading-relaxed text-cream/70 sm:text-base lg:max-w-[280px]">
            Built for the 75 million freelancers in Asia-Pacific who lose 18% of every gig
            to PayPal, SWIFT, and Upwork.
          </p>
        </div>

        {/* Bottom row stats */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "$500B+", l: "Asia freelance flow / year",  k: "market" },
            { v: "$10-20B", l: "Annual fee leakage",         k: "problem" },
            { v: "<1 sec",  l: "Arc finality time",          k: "speed" },
            { v: "MIT",    l: "Forever open source",         k: "license" },
          ].map((s) => (
            <div key={s.k} className="liquid-glass rounded-2xl p-5">
              <p className="font-display text-3xl text-cream sm:text-4xl">{s.v}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-cream/60">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 *  SECTION 3 — LIVE FLOW (replaces NFT "collection grid")
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
    <section id="flow" className="relative bg-ink py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-landing px-6 lg:px-12">
        {/* Header row */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[32px] uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-[60px]">
            How it
            <br className="lg:hidden" />
            <span className="ml-12 sm:ml-24 lg:ml-32">
              <span className="font-script text-signal opacity-90 mix-blend-exclusion">
                actually
              </span>{" "}
              works
            </span>
          </h2>

          {/* "RUN THE DEMO" button */}
          <Link href="/client" className="group block">
            <div className="flex items-end gap-3">
              <span className="font-display text-3xl uppercase tracking-wider text-cream sm:text-5xl lg:text-[60px]">
                Run
              </span>
              <div className="flex flex-col">
                <span className="font-display text-xl uppercase tracking-wider text-cream/80 sm:text-2xl lg:text-3xl">
                  the
                </span>
                <span className="font-display text-xl uppercase tracking-wider text-cream/80 sm:text-2xl lg:text-3xl">
                  demo
                </span>
              </div>
              <ArrowRight className="ml-1 mb-1 h-6 w-6 text-cream transition-transform group-hover:translate-x-1 sm:h-8 sm:w-8" />
            </div>
            <div className="mt-3 h-1.5 w-full bg-signal sm:h-2 lg:h-2.5" />
          </Link>
        </div>

        {/* Cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, idx) => (
            <Link
              key={s.title}
              href={s.href}
              className="liquid-glass group block rounded-[32px] p-5 transition-colors hover:bg-white/10"
            >
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0a1238] via-[#061026] to-[#010828]">
                {/* Background orbit ring */}
                <div className="absolute inset-8 rounded-full border border-white/5" />
                <div className="absolute inset-16 rounded-full border border-white/5" />
                {/* Animated dot */}
                <div className="absolute h-2 w-2 animate-flow rounded-full bg-signal shadow-[0_0_24px_rgba(0,209,140,0.8)]" style={{ top: `${20 + idx * 20}%`, left: `${30 + idx * 15}%` }} />
                {/* Step number */}
                <span className="absolute left-5 top-4 font-display text-[11px] uppercase tracking-widest text-cream/40">
                  Step {String(idx + 1).padStart(2, "0")}
                </span>
                {/* Icon */}
                <s.Icon className="h-20 w-20 text-cream/80 transition-transform group-hover:scale-110" strokeWidth={1.2} />
              </div>

              {/* Overlay bar */}
              <div className="liquid-glass mt-4 flex items-center justify-between gap-3 rounded-[20px] px-5 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-cream/60">
                    {s.kpiLabel}
                  </p>
                  <p className="font-display text-base uppercase text-cream">{s.kpi}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#00d18c] to-[#00a36e] shadow-lg shadow-[#00d18c]/40 transition-transform group-hover:scale-110">
                  <ChevronRight className="h-5 w-5 text-ink" strokeWidth={3} />
                </div>
              </div>

              {/* Title + description */}
              <div className="mt-4 px-1">
                <p className="font-display text-2xl uppercase text-cream">{s.title}</p>
                <p className="mt-2 font-mono text-[11px] uppercase leading-relaxed text-cream/60">
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

/* =====================================================================
 *  SECTION 4 — CTA
 * ===================================================================== */

function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-space py-24 sm:py-28 lg:py-36">
      <div className="absolute inset-0 bg-stars opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />

      <div className="relative mx-auto grid max-w-landing grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[auto_1fr] lg:gap-24 lg:px-12">
        {/* LEFT — vertical social icons, tight 64px stack */}
        <div className="liquid-glass relative mx-auto w-fit flex-shrink-0 flex flex-col rounded-2xl lg:mx-0">
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
                "grid h-16 w-16 place-items-center transition-colors hover:bg-white/10" +
                (i < arr.length - 1 ? " border-b border-white/10" : "")
              }
            >
              <Icon className="h-5 w-5 text-cream" />
            </a>
          ))}
        </div>

        {/* RIGHT — heading + buttons */}
        <div className="relative max-w-2xl text-left lg:text-right">
          {/* "Go beyond" cursive accent */}
          <span
            aria-hidden
            className="font-script mb-2 block text-3xl text-signal sm:text-4xl lg:text-5xl"
          >
            Go beyond
          </span>

          <h2 className="font-display text-[32px] uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
            <span className="block">Join us.</span>
            <span className="block">Fork the repo.</span>
            <span className="block">Ship your own.</span>
            <span className="block">Follow the signal.</span>
          </h2>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a
              href="https://github.com/orangterkucil/freelancebot"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-signal px-6 py-4 font-display text-sm uppercase tracking-wider text-ink transition-transform hover:scale-[1.02]"
            >
              <Github className="h-4 w-4" />
              Star the repo
            </a>
            <a
              href="https://github.com/orangterkucil/freelancebot/blob/main/PRD.md"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-sm uppercase tracking-wider text-cream transition-colors hover:bg-white/10"
            >
              Read the PRD
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
