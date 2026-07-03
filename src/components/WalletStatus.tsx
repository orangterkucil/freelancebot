"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wallet as WalletIcon,
  AlertCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { connectWallet, getUsdcReadonly, fromUsdcUnits, addressUrl } from "@/lib/contracts";

/**
 * WalletStatus — Connect wallet button + connected wallet dropdown.
 *
 * v0.13.1: connected pill is now a dropdown menu (not a raw explorer link)
 * so users can:
 *   - copy address
 *   - view on arcscan
 *   - refresh balance
 *   - switch wallet (re-request accounts)
 *   - disconnect (clear local address state)
 *
 * Note: EIP-1193 has no way to force MetaMask to sign the user *out* of a
 * dapp — the wallet extension owns that state. Our "Disconnect" clears the
 * displayed address in the app and returns to the Connect button. Users can
 * fully disconnect by revoking site access from MetaMask's own UI.
 */
export function WalletStatus() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const refresh = async (addr: string) => {
    setAddress(addr);
    try {
      const usdc = getUsdcReadonly();
      const bal = await usdc.balanceOf(addr);
      setBalance(fromUsdcUnits(bal));
    } catch {
      setBalance(null);
    }
  };

  // Detect existing connection on mount (uses non-deprecated eth_accounts)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) { setHasWallet(false); return; }

    (async () => {
      try {
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) refresh(accounts[0]);
      } catch {}
    })();

    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setBalance(null);
      } else {
        refresh(accounts[0]);
      }
    };
    const onChainChanged = () => {
      if (eth.selectedAddress) refresh(eth.selectedAddress);
    };
    eth.on?.("accountsChanged", onAccountsChanged);
    eth.on?.("chainChanged", onChainChanged);
    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const onConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const { address } = await connectWallet();
      await refresh(address);
    } catch (e: any) {
      const raw = e?.message ?? "Failed to connect";
      if (/reject|denied|4001/i.test(raw)) setError("You rejected the connection.");
      else if (/no injected wallet/i.test(raw)) { setHasWallet(false); setError(null); }
      else setError(raw);
    } finally {
      setBusy(false);
    }
  };

  const onCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const onSwitchWallet = async () => {
    setMenuOpen(false);
    setBusy(true);
    setError(null);
    try {
      // Ask MetaMask for wallet permissions again — user can pick a different account
      const eth = (window as any).ethereum;
      if (eth?.request) {
        try {
          await eth.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch {
          // Fallback: plain accounts request
        }
      }
      const { address } = await connectWallet();
      await refresh(address);
    } catch (e: any) {
      const raw = e?.message ?? "Switch failed";
      if (!/reject|denied|4001/i.test(raw)) setError(raw);
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = () => {
    setAddress(null);
    setBalance(null);
    setMenuOpen(false);
  };

  const onRefresh = async () => {
    if (!address) return;
    setBusy(true);
    try {
      await refresh(address);
    } finally {
      setBusy(false);
    }
  };

  // No wallet installed — link to install MetaMask
  if (!hasWallet) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:border-amber-400 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <AlertCircle className="h-3 w-3" />
        Install MetaMask
      </a>
    );
  }

  // Not connected — show connect button
  if (!address) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={onConnect}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand hover:text-brand disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <WalletIcon className="h-3 w-3" />
          {busy ? "Connecting…" : "Connect wallet"}
        </button>
        {error && (
          <span className="hidden max-w-[180px] truncate font-mono text-[10px] text-rose-600 md:inline">{error}</span>
        )}
      </div>
    );
  }

  // Connected — show wallet pill with dropdown menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((s) => !s)}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs hover:border-emerald-300 dark:border-emerald-800/50 dark:bg-emerald-950/30"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-emerald-900 dark:text-emerald-300">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        {balance !== null && (
          <span className="hidden font-mono text-emerald-700 dark:text-emerald-400 sm:inline">· {balance} USDC</span>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Connected wallet</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-900 dark:text-slate-100" title={address}>
              {address}
            </p>
            {balance !== null && (
              <p className="mt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                Balance: {balance} USDC
              </p>
            )}
          </div>
          <MenuItem icon={copied ? Check : Copy} label={copied ? "Copied!" : "Copy address"} onClick={onCopyAddress} />
          <a
            href={addressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMenuOpen(false)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on arcscan
          </a>
          <MenuItem icon={RefreshCw} label={busy ? "Refreshing…" : "Refresh balance"} onClick={onRefresh} disabled={busy} />
          <MenuItem icon={WalletIcon} label="Switch wallet" onClick={onSwitchWallet} />
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <MenuItem icon={LogOut} label="Disconnect" onClick={onDisconnect} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors disabled:opacity-50 " +
        (danger
          ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
