"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * ThemeToggle — light ↔ dark toggle for the header (top-right).
 *
 * Storage: `fb_theme` in localStorage ("light" | "dark").
 * Effect: toggles `html.dark` class. Dark styles live in globals.css as
 * CSS-variable overrides on `html.dark` so the app doesn't need per-element
 * `dark:` Tailwind variants (which we stripped for MVP 1 consistency).
 *
 * v0.14.2: replaces the "force light" boot script. Users choose their theme.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const t = window.localStorage.getItem("fb_theme");
      const initial: "light" | "dark" = t === "dark" ? "dark" : "light";
      setTheme(initial);
      apply(initial);
    } catch {
      apply("light");
    }
  }, []);

  function apply(next: "light" | "dark") {
    if (typeof document === "undefined") return;
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    apply(next);
    try { window.localStorage.setItem("fb_theme", next); } catch {}
  }

  // SSR-safe: render a stable placeholder until mounted (prevents hydration flash)
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={
          "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm " +
          (compact ? "h-9 w-9" : "h-9 px-3")
        }
      >
        <Sun className="h-3.5 w-3.5" />
      </span>
    );
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        "group inline-flex items-center justify-center rounded-full border shadow-sm transition-colors " +
        (isDark
          ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-brand hover:text-brand"
          : "border-slate-200 bg-white/90 text-slate-700 hover:border-brand hover:text-brand") +
        " " + (compact ? "h-9 w-9" : "h-9 px-3 font-mono text-[11px] uppercase tracking-wider")
      }
    >
      {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      {!compact && (
        <span className="ml-1.5">{isDark ? "Dark" : "Light"}</span>
      )}
    </button>
  );
}
