"use client";

import { useEffect, useState } from "react";
import { connectWallet, getUsdcReadonly, fromUsdcUnits, addressUrl } from "@/lib/contracts";

export function WalletStatus() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth?.selectedAddress) return;
    refresh(eth.selectedAddress);
  }, []);

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

  const onConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const { address } = await connectWallet();
      await refresh(address);
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect");
    } finally {
      setBusy(false);
    }
  };

  if (!address) {
    return (
      <button
        onClick={onConnect}
        disabled={busy}
        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand disabled:opacity-50"
      >
        {busy ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-emerald-900 hover:underline"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </a>
      {balance !== null && (
        <span className="text-emerald-700">· {balance} USDC</span>
      )}
      {error && <span className="text-rose-700">· {error}</span>}
    </div>
  );
}
