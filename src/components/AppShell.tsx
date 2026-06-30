"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Compass,
  Wallet,
  Activity,
  Settings,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { WalletStatus } from "./WalletStatus";

/**
 * Dashboard shell with persistent left sidebar + top breadcrumb + main content.
 *
 * Replaces the previous bare AppHeader for /client, /freelancer, /orders pages.
 * Sidebar collapses to a drawer on mobile.
 *
 * Sections (per current MVP scope):
 *   - Client area    → /client, /client/?tab=orders, /client/?tab=wallet
 *   - Freelancer area → /freelancer
 *   - Marketplace    → /jobs   (v0.9.0)
 *   - Activity       → /activity (placeholder for now)
 */

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/client",     label: "Client",      Icon: Briefcase },
  { href: "/freelancer", label: "Freelancer",  Icon: Compass },
  { href: "/jobs",       label: "Marketplace", Icon: Wallet, badge: "v0.9" },
  { href: "/activity",   label: "Activity",    Icon: Activity, badge: "soon" },
  { href: "/settings",   label: "Settings",    Icon: Settings, badge: "soon" },
];

export function AppShell({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-ink text-cream">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/85 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((s) => !s)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link href="/" className="group flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-signal/30 to-signal/10 ring-1 ring-signal/40">
                <span className="font-display text-sm text-signal">F</span>
              </div>
              <span className="font-display text-sm uppercase tracking-wider text-cream">
                FreelanceBot
              </span>
              <span className="hidden rounded-full border border-white/10 px-1.5 py-px font-mono text-[9px] uppercase text-cream/50 group-hover:text-signal sm:inline-block">
                v0.8.0
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {breadcrumb && (
              <div className="hidden font-mono text-[10px] uppercase tracking-widest text-cream/40 md:block">
                {breadcrumb}
              </div>
            )}
            <WalletStatus />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-landing grid-cols-1 lg:grid-cols-[240px_1fr]">
        {/* Sidebar (desktop persistent, mobile drawer) */}
        <aside
          className={
            "fixed inset-y-0 left-0 top-[57px] z-30 w-[260px] transform border-r border-white/5 bg-ink p-5 transition-transform lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:translate-x-0 lg:bg-transparent lg:p-6 " +
            (mobileOpen ? "translate-x-0" : "-translate-x-full")
          }
          aria-label="Primary"
        >
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={
                    "group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors " +
                    (active
                      ? "bg-signal/10 ring-1 ring-signal/30"
                      : "hover:bg-white/[0.04]")
                  }
                >
                  <span className="flex items-center gap-3">
                    <item.Icon className={"h-4 w-4 " + (active ? "text-signal" : "text-cream/60 group-hover:text-cream")} />
                    <span className={"font-display text-sm uppercase tracking-wider " + (active ? "text-cream" : "text-cream/70 group-hover:text-cream")}>
                      {item.label}
                    </span>
                  </span>
                  {item.badge && (
                    <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cream/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-white/5 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
              Resources
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="https://github.com/orangterkucil/freelancebot" target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] uppercase tracking-wider text-cream/50 hover:text-signal">
                  GitHub repo ↗
                </a>
              </li>
              <li>
                <a href="https://github.com/orangterkucil/freelancebot/blob/main/PRD.md" target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] uppercase tracking-wider text-cream/50 hover:text-signal">
                  PRD ↗
                </a>
              </li>
              <li>
                <a href={`https://testnet.arcscan.app/address/${process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? ""}`} target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] uppercase tracking-wider text-cream/50 hover:text-signal">
                  Contract on Arc ↗
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-[57px] z-20 bg-ink/60 backdrop-blur-sm lg:hidden"
            aria-hidden
          />
        )}

        {/* Main */}
        <main className="px-5 py-6 lg:px-10 lg:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/" className="mb-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/40 hover:text-signal">
                <ArrowLeft className="h-3 w-3" />
                Back to landing
              </Link>
              <h1 className="font-display text-3xl uppercase tracking-tight text-cream sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-cream/50">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
