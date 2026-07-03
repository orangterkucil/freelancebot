"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Twitter,
  Github,
  Globe,
  Linkedin,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  Bell,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LOCALES, setLocale as applyLocale, readLocale } from "@/lib/i18n";

/**
 * Basic settings. NOT critical config (no API keys, no contract config, nothing
 * that touches secrets). All values live in the user's localStorage so they
 * stay private to their browser session. Server never receives them unless
 * explicitly attached to an action (e.g. order.client_links).
 */
export default function SettingsPage() {
  // Profile defaults
  const [clientEmail, setClientEmail] = useState("");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Preferences
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [locale, setLocale] = useState("en");
  const [notifNew, setNotifNew] = useState(true);
  const [notifStatus, setNotifStatus] = useState(true);
  const [notifVerdict, setNotifVerdict] = useState(false);
  const [notifEmail, setNotifEmail] = useState("");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setClientEmail(window.localStorage.getItem("fb_client_email") ?? "");
      setFreelancerEmail(window.localStorage.getItem("fb_freelancer_email") ?? "");
      setXHandle(window.localStorage.getItem("fb_profile_x") ?? "");
      setGithub(window.localStorage.getItem("fb_profile_github") ?? "");
      setWebsite(window.localStorage.getItem("fb_profile_website") ?? "");
      setLinkedin(window.localStorage.getItem("fb_profile_linkedin") ?? "");

      const t = window.localStorage.getItem("fb_theme");
      if (t === "light" || t === "dark" || t === "system") setTheme(t);
      const l = window.localStorage.getItem("fb_locale");
      if (l) setLocale(l);

      const ne = window.localStorage.getItem("fb_notify_email") ?? "";
      setNotifEmail(ne);
      setNotifNew(window.localStorage.getItem("fb_notify_new") !== "0");
      setNotifStatus(window.localStorage.getItem("fb_notify_status") !== "0");
      setNotifVerdict(window.localStorage.getItem("fb_notify_verdict") === "1");
    } catch {}
  }, []);

  // Dark mode is intentionally light-only in MVP 1 — see globals.css note.
  // Force-clear any stale value so the user can't get stuck in a broken state.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("dark");
    try { window.localStorage.setItem("fb_theme", "light"); } catch {}
  }, [theme]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem("fb_profile_x",        xHandle.trim());
      window.localStorage.setItem("fb_profile_github",   github.trim());
      window.localStorage.setItem("fb_profile_website",  website.trim());
      window.localStorage.setItem("fb_profile_linkedin", linkedin.trim());
      window.localStorage.setItem("fb_theme",            theme);
      window.localStorage.setItem("fb_locale",           locale);
      window.localStorage.setItem("fb_notify_email",     notifEmail.trim());
      window.localStorage.setItem("fb_notify_new",       notifNew     ? "1" : "0");
      window.localStorage.setItem("fb_notify_status",    notifStatus  ? "1" : "0");
      window.localStorage.setItem("fb_notify_verdict",   notifVerdict ? "1" : "0");

      // Light-only for now; dark mode lands v0.12.0
      // Reflect choice on <html> for the toggle button visual
      if (typeof document !== "undefined") {
        document.documentElement.lang = locale;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const signOut = (key: string) => {
    try { window.localStorage.removeItem(key); } catch {}
    if (key === "fb_client_email") setClientEmail("");
    if (key === "fb_freelancer_email") setFreelancerEmail("");
  };

  return (
    <AppShell title="Settings" subtitle="Basic preferences · profile · privacy" breadcrumb={<>Settings</>}>
      <form onSubmit={save}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Profile defaults */}
            <Section icon={ShieldCheck} title="Profile defaults" description="Shown on every order you post. Local to your browser — never sent to any server unless you attach them.">
              <SocialInput Icon={Twitter}  label="X / Twitter" value={xHandle}  onChange={setXHandle}  placeholder="yourhandle" />
              <SocialInput Icon={Github}   label="GitHub"      value={github}   onChange={setGithub}   placeholder="yourhandle" />
              <SocialInput Icon={Globe}    label="Website"     value={website}  onChange={setWebsite}  placeholder="https://yourdomain.com" />
              <SocialInput Icon={Linkedin} label="LinkedIn"    value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/you" />
            </Section>

            {/* Theme */}
            <Section icon={Sun} title="Theme" description="MVP 1 ships light-only. Dark theme is on the MVP 2 roadmap — it needs a full design pass across every gradient card, tinted background, and colored border for visual coherence.">
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <ThemePill Icon={Sun}     label="Light"  active={theme === "light"}  onClick={() => setTheme("light")} />
                <ThemePill Icon={Moon}    label="Dark"   active={theme === "dark"}   onClick={() => setTheme("dark")} disabled hint="MVP 2" />
                <ThemePill Icon={Monitor} label="System" active={theme === "system"} onClick={() => setTheme("system")} disabled hint="MVP 2" />
              </div>
            </Section>

            {/* Language */}
            <Section icon={Languages} title="Language" description="Applies instantly to the whole app. Arabic renders right-to-left. Static UI covered; AI agent adapts to your typing language as before.">
              <select
                value={locale}
                onChange={(e) => {
                  const next = e.target.value as any;
                  setLocale(next);
                  applyLocale(next);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 outline-none focus:border-brand"
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.native} — {l.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 font-mono text-[10px] tracking-wide text-slate-400">
                6 languages covered · covers &gt;3.5B speakers worldwide.
              </p>
            </Section>

            {/* Notifications */}
            <Section icon={Bell} title="Email notifications" description="Get an email when something important happens. Wired in the next milestone — for now the toggles remember your choice.">
              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-600">Notification email</span>
                <input
                  type="email"
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand"
                />
              </label>
              <div className="mt-4 space-y-2">
                <Toggle label="New application on your job" sub="Client side · someone applied to your post" value={notifNew}     onChange={setNotifNew} />
                <Toggle label="Order status change"          sub="Funded · Delivered · Released · Refunded"  value={notifStatus}  onChange={setNotifStatus} />
                <Toggle label="Agent verdict ready"          sub="Off by default — can be noisy"             value={notifVerdict} onChange={setNotifVerdict} />
              </div>
            </Section>

            {/* Privacy / Security */}
            <Section icon={ShieldCheck} title="Privacy & security">
              <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-slate-600">
                <li>· We never ask for API keys, private keys, or wallet seed phrases here.</li>
                <li>· Settings on this page live in your browser only.</li>
                <li>· Order data lives in Supabase. Chat messages are visible only to the two parties.</li>
                <li>· Attachments are visible per the order&apos;s public/private flag.</li>
                <li>· On-chain transactions are signed by your wallet — we never see your key.</li>
              </ul>
              <p className="mt-3 font-mono text-[11px] text-slate-700">
                If anything ever asks you to paste a private key or seed phrase into the FreelanceBot interface — that is not us. Report it.
              </p>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <button
              type="submit"
              className="btn-gradient w-full rounded-xl px-5 py-3 font-display text-xs uppercase tracking-wider"
            >
              <Save className="inline h-4 w-4 mr-1" />
              {saved ? "Saved ✓" : "Save all settings"}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm uppercase tracking-wider text-slate-900">Signed-in sessions</h3>
              <div className="mt-3 space-y-2">
                <SessionRow role="Client"     email={clientEmail}      onSignOut={() => signOut("fb_client_email")} />
                <SessionRow role="Freelancer" email={freelancerEmail}  onSignOut={() => signOut("fb_freelancer_email")} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm uppercase tracking-wider text-slate-900">About</h3>
              <dl className="mt-3 space-y-2 font-mono text-[11px]">
                <Row label="Version">v0.11.0</Row>
                <Row label="Network">Arc Testnet</Row>
                <Row label="Settlement">USDC</Row>
                <Row label="AI Model">Groq Llama 3.3 70B</Row>
                <Row label="License">MIT</Row>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm uppercase tracking-wider text-slate-900">Links</h3>
              <ul className="mt-3 space-y-2 font-mono text-[11px]">
                <li><a href="https://github.com/orangterkucil/freelancebot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">GitHub repository <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://github.com/orangterkucil/freelancebot/blob/main/PRD.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">Product Requirements (PRD) <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://github.com/orangterkucil/freelancebot/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">Changelog <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

// ---- Small subcomponents -----------------------------------------------------

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand" />
        <h2 className="font-display text-base uppercase text-slate-900">{title}</h2>
      </div>
      {description && (
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-500">{description}</p>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function SocialInput({
  Icon, label, value, onChange, placeholder,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}

function ThemePill({
  Icon, label, active, onClick, disabled, hint,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={
        "flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors " +
        (active ? "bg-brand text-white shadow-sm"
          : disabled ? "text-slate-400 cursor-not-allowed"
          : "text-slate-700 hover:bg-slate-100")
      }
    >
      <Icon className="h-4 w-4" />
      <span className="font-display text-[10px] uppercase tracking-wider">{label}</span>
      {hint && <span className="font-mono text-[9px] uppercase tracking-widest text-amber-600">{hint}</span>}
    </button>
  );
}

function Toggle({
  label, sub, value, onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50">
      <span className="min-w-0">
        <span className="block font-display text-xs uppercase tracking-wider text-slate-900">{label}</span>
        {sub && <span className="mt-0.5 block font-mono text-[10px] tracking-wide text-slate-500">{sub}</span>}
      </span>
      <span className="relative inline-block h-5 w-9 shrink-0">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 opacity-0"
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

function SessionRow({ role, email, onSignOut }: { role: string; email: string; onSignOut: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{role}</span>
        <p className="truncate font-mono text-xs text-slate-900">
          {email ? email : <span className="italic text-slate-400">Not signed in</span>}
        </p>
      </div>
      {email && (
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-slate-700 hover:border-rose-400 hover:text-rose-700"
        >
          <LogOut className="h-3 w-3" />
          Sign out
        </button>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="font-mono text-xs text-slate-900">{children}</dd>
    </div>
  );
}
