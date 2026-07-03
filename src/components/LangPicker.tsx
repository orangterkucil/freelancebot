"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { LOCALES, readLocale, setLocale, type Locale } from "@/lib/i18n";

/**
 * Compact dropdown for switching UI language.
 * Placed in landing header + AppShell top bar so international visitors see
 * their language on first paint.
 */
export function LangPicker({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>("en");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrent(readLocale()); }, []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const active = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label="Change language"
        className={
          "inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur transition-colors hover:border-brand hover:text-brand " +
          (compact ? "h-9 w-9 place-content-center" : "h-10 px-3 font-mono text-[11px] uppercase tracking-wider")
        }
      >
        <Globe className="h-3.5 w-3.5" />
        {!compact && <span>{active.flag} {active.code.toUpperCase()}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
          {LOCALES.map((l) => {
            const isActive = l.code === current;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code)}
                className={
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors " +
                  (isActive
                    ? "bg-brand/10 text-brand"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100")
                }
              >
                <span className="text-base">{l.flag}</span>
                <span className="flex-1">
                  <span className="block font-semibold">{l.native}</span>
                  <span className="block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">{l.label}</span>
                </span>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
