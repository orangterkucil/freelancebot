import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // App (kept for /client, /freelancer, /orders pages)
        brand: {
          DEFAULT: "#0ea5e9",
          dark: "#0369a1",
        },
        // Landing (Orbis-inspired) palette
        ink:    "#010828", // deep navy bg
        cream:  "#EFF4FF", // off-white text
        signal: "#00D18C", // stablecoin green accent (replaces #6FFF00 highlighter)
        glass:  "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        // Landing — uses next/font CSS variables defined in layout.tsx
        display: ['var(--font-anton)', 'Anton', 'Impact', 'sans-serif'],
        script:  ['var(--font-condiment)', 'Condiment', 'cursive'],
        mono:    ['var(--font-jb-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        // Orbis spec: max content width 1831px
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
