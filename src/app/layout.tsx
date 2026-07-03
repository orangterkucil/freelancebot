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
  // Boot script: reads fb_theme + fb_locale from localStorage BEFORE first
  // paint. Applies `dark` class and `lang`/`dir` attributes so users never see
  // a flash of the wrong theme or LTR text on Arabic first paint.
  const themeBoot = `
    (function() {
      try {
        var t = localStorage.getItem('fb_theme') || 'light';
        var useDark = t === 'dark' ||
          (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (useDark) document.documentElement.classList.add('dark');
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
