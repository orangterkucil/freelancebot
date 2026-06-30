"use client";

import { useState } from "react";
import Image from "next/image";
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

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/client",     label: "Client",      Icon: Briefcase },
  { href: "/freelancer", label: "Freelancer",  Icon: Compass },
  { href: "/jobs",       label: "Marketplace", Icon: Wallet },
  { href: "/freelancer/applications", label: "Applications", Icon: Activity },
  { href: "/settings",   label: "Settings",    Icon: Settings },
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((s) => !s)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link href="/" className="group flex items-center gap-2.5">
              <Image
                src="/logo-mark.svg"
                alt="FreelanceBot"
                width={32}
                height={32}
                className="transition-transform group-hover:scale-105"
              />
              <span className="font-display text-sm uppercase tracking-wider text-slate-900">
                FreelanceBot
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {breadcrumb && (
              <div className="hidden font-mono text-[10px] uppercase tracking-widest text-slate-500 md:block">
                {breadcrumb}
              </div>
            )}
            <WalletStatus />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-landing grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside
          className={
            "fixed inset-y-0 left-0 top-[57px] z-30 flex w-[260px] transform flex-col justify-between border-r border-slate-200 bg-white p-5 transition-transform lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:translate-x-0 lg:bg-transparent lg:p-6 " +
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
                      ? "bg-brand/10 ring-1 ring-brand/30"
                      : "hover:bg-slate-100")
                  }
                >
                  <span className="flex items-center gap-3">
                    <item.Icon className={"h-4 w-4 " + (active ? "text-brand" : "text-slate-500 group-hover:text-slate-700")} />
                    <span className={"font-display text-sm uppercase tracking-wider " + (active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900")}>
                      {item.label}
                    </span>
                  </span>
                  {item.badge && (
                    <span className="rounded-full border border-slate-200 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Resources pinned to bottom-left */}
          <div className="border-t border-slate-200 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Resources
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <a href="https://github.com/orangterkucil/freelancebot" target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-brand">
                  GitHub ↗
                </a>
              </li>
              <li>
                <Link href="/docs" className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-brand">
                  Docs ↗
                </Link>
              </li>
              <li>
                <a href={`https://testnet.arcscan.app/address/${process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? ""}`} target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-brand">
                  Contract on Arc ↗
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-[57px] z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            aria-hidden
          />
        )}

        <main className="px-5 py-6 lg:px-10 lg:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/" className="mb-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-brand">
                <ArrowLeft className="h-3 w-3" />
                Back to landing
              </Link>
              <h1 className="font-display text-3xl uppercase tracking-tight text-slate-900 sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-slate-500">
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
