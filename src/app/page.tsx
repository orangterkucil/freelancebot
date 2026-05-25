import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-dark">
          FreelanceBot · on Arc
        </p>
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900">
          Get paid the moment you deliver.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          An AI agent that handles end-to-end freelancer payouts. Clients fund
          USDC escrow on Arc, deliverables get auto-verified, payment releases in
          sub-second. No PayPal fees, no SWIFT wait, no Upwork hold.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/client"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-slate-900">
            I'm a client →
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Fund an order in USDC and let the agent handle verification and
            payout.
          </p>
        </Link>

        <Link
          href="/freelancer"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-slate-900">
            I'm a freelancer →
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Submit deliverables in chat. Get USDC the second the client
            approves.
          </p>
        </Link>
      </section>

      <footer className="mt-16 space-y-2 border-t border-slate-200 pt-6 text-sm text-slate-500">
        <p>
          Built for the Stablecoins Commerce Stack Challenge · Track 4 (Agentic
          Economy) · Circle &amp; Arc · 2026
        </p>
        <p>
          Contract on Arc Testnet:{" "}
          <a
            href="https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-brand hover:underline"
          >
            0xA8CA04560603951b0f0e803039B059432F673ae4 ↗
          </a>{" "}
          <span className="text-emerald-600">✓ source verified</span>
        </p>
        <p>
          <a href="https://github.com/orangterkucil/freelancebot" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
            GitHub repo ↗
          </a>
        </p>
      </footer>
    </main>
  );
}
