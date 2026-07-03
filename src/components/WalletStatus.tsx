"use client";

import { useEffect, useState } from "react";
import { Wallet as WalletIcon, AlertCircle } from "lucide-react";
import { connectWallet, getUsdcReadonly, fromUsdcUnits, addressUrl } from "@/lib/contracts";

/**
 * WalletStatus — Connect wallet button + connected state pill.
 *
 * v0.13.0 fixes:
 *  - Uses `eth_accounts` (RPC) instead of deprecated `selectedAddress`
 *  - Listens for `accountsChanged` + `chainChanged` so the UI stays in sync
 *  - Explicit fallback when MetaMask is not installed (link to install)
 *  - Friendlier error messages (rejected connect, wrong chain, etc.)
 */
export function WalletStatus() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState<boolean>(true);

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

  // Connected — show wallet pill
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs dark:border-emerald-800/50 dark:bg-emerald-950/30">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-emerald-900 hover:underline dark:text-emerald-300"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </a>
      {balance !== null && (
        <span className="hidden font-mono text-emerald-700 dark:text-emerald-400 sm:inline">· {balance} USDC</span>
      )}
    </div>
  );
}
