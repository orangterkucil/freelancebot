"use client";

import Link from "next/link";
import { WalletStatus } from "./WalletStatus";

/**
 * Shared header for /client, /freelancer, /orders/* — keeps the brand
 * identity consistent across the app and matches the dark luxe landing.
 *
 * Mirrors the landing's logo + version pill on the left and shows the
 * WalletStatus pill on the right. Breadcrumb text in the middle is optional
 * (children prop).
 */
export function AppHeader({
  children,
  showWallet = true,
}: {
  children?: React.ReactNode;
  showWallet?: boolean;
}) {
  return (
    <header className="border-b border-white/5 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-landing items-center justify-between gap-4 px-6 py-4 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-signal/30 to-signal/10 ring-1 ring-signal/40">
            <span className="font-display text-lg text-signal">F</span>
          </div>
          <div className="leading-none">
            <span className="block font-display text-base uppercase tracking-wider text-cream">
              FreelanceBot
            </span>
            <span className="mt-0.5 inline-block rounded-full border border-white/10 px-1.5 py-px font-mono text-[9px] uppercase text-cream/50 transition-colors group-hover:text-signal">
              v0.8.0 · on arc
            </span>
          </div>
        </Link>

        {children && (
          <div className="hidden flex-1 items-center justify-center md:flex">
            {children}
          </div>
        )}

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-5 lg:flex">
            {[
              { href: "/client",     label: "Client" },
              { href: "/freelancer", label: "Freelancer" },
              { href: "/",           label: "Home" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-display text-[12px] uppercase tracking-wider text-cream/70 transition-colors hover:text-signal"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          {showWallet && <WalletStatus />}
        </div>
      </div>
    </header>
  );
}
