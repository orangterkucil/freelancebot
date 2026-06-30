"use client";

import Image from "next/image";
import Link from "next/link";
import { WalletStatus } from "./WalletStatus";

export function AppHeader({
  children,
  showWallet = true,
}: {
  children?: React.ReactNode;
  showWallet?: boolean;
}) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-landing items-center justify-between gap-4 px-6 py-4 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo-mark.svg"
            alt="FreelanceBot"
            width={40}
            height={40}
            className="transition-transform group-hover:scale-105"
          />
          <div className="leading-none">
            <span className="block font-display text-base uppercase tracking-wider text-slate-900">
              FreelanceBot
            </span>
            <span className="mt-0.5 inline-block rounded-full border border-slate-200 px-1.5 py-px font-mono text-[9px] uppercase text-slate-500 transition-colors group-hover:text-brand">
              v0.10.1 · on arc
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
              { href: "/jobs",       label: "Marketplace" },
              { href: "/",           label: "Home" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-display text-[12px] uppercase tracking-wider text-slate-600 transition-colors hover:text-brand"
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
