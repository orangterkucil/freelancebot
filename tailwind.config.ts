import type { Config } from "tailwindcss";

/**
 * v0.10.0 — reverted to a light "putih + biru" palette.
 *
 * Semantic token names (ink / cream / signal / glass) kept so existing class
 * usage across the codebase keeps working without churn. Values are remapped:
 *   - ink    → page background (white / slate-50)
 *   - cream  → primary text (slate-900)
 *   - signal → accent + CTA (brand blue)
 *   - glass  → subtle dark-on-light tint for translucent surfaces
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  // Safelist dark-mode gradient/ring/bg classes used dynamically in accentMap
  // objects. Tailwind JIT can miss these when the string is assembled at runtime.
  safelist: [
    // Client stat card gradients
    "dark:from-sky-950/40", "dark:to-slate-900", "dark:ring-sky-800/60",
    "dark:from-amber-950/40", "dark:ring-amber-800/60",
    "dark:from-emerald-950/40", "dark:ring-emerald-800/60",
    "dark:from-indigo-950/40", "dark:ring-indigo-800/60",
    // Icon badges in cards
    "dark:bg-sky-900/50", "dark:text-sky-300",
    "dark:bg-amber-900/50", "dark:text-amber-300",
    "dark:bg-emerald-900/50", "dark:text-emerald-300",
    "dark:bg-indigo-900/50", "dark:text-indigo-300",
    // Empty state 3-column step cards
    "dark:from-sky-950/40", "dark:from-amber-950/40", "dark:from-emerald-950/40",
    "dark:border-sky-800/50", "dark:via-slate-900", "dark:to-indigo-950/30", "dark:from-sky-950/30",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0ea5e9",
          dark:    "#0369a1",
        },
        // semantic tokens (LIGHT theme)
        ink:    "#ffffff",      // was #010828
        cream:  "#0f172a",      // was #EFF4FF — now slate-900 for primary text
        signal: "#0ea5e9",      // was #00D18C — now brand blue
        glass:  "rgba(15,23,42,0.03)",
      },
      fontFamily: {
        display: ['var(--font-anton)', 'Anton', 'Impact', 'sans-serif'],
        script:  ['var(--font-condiment)', 'Condiment', 'cursive'],
        mono:    ['var(--font-jb-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        landing: '1831px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit':      'orbit 28s linear infinite',
        'flow':       'flow 6s ease-in-out infinite',
      },
      keyframes: {
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(140px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(140px) rotate(-360deg)' },
        },
        flow: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.7' },
          '50%':      { transform: 'translateY(-8px)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
