import type { Metadata } from "next";
import { Anton, Condiment, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const condiment = Condiment({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-condiment",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FreelanceBot — Autonomous Payment Agent for Global Freelancers",
  description:
    "Clients fund USDC escrow on Arc, AI agent verifies deliverables, payment releases in sub-second. No PayPal fees, no SWIFT wait.",
  icons: {
    icon: "/logo-mark.svg",
    apple: "/logo-mark.svg",
  },
  openGraph: {
    title: "FreelanceBot — Get paid the moment you deliver.",
    description:
      "AI payment agent for global freelancers, built on Arc + USDC. Sub-second settlement, no PayPal fees.",
    type: "website",
    url: "https://freelancebot-alpha.vercel.app",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "FreelanceBot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FreelanceBot — Get paid the moment you deliver.",
    description: "AI payment agent for global freelancers on Arc + USDC.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force light theme — dark mode needs a proper design token refactor
  // (every gradient card, tinted surface, and Section header needs paired
  // tokens, not bulk sed). Ships in MVP 2. Also apply lang/dir from
  // fb_locale so Arabic RTL doesn't flash on first paint.
  const themeBoot = `
    (function() {
      try {
        localStorage.setItem('fb_theme', 'light');
        document.documentElement.classList.remove('dark');
        var l = localStorage.getItem('fb_locale') || 'en';
        var rtl = l === 'ar';
        document.documentElement.lang = l;
        document.documentElement.dir  = rtl ? 'rtl' : 'ltr';
      } catch (e) {}
    })();
  `;
  return (
    <html lang="en" className={`${anton.variable} ${condiment.variable} ${jbMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-signal selection:text-white dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
