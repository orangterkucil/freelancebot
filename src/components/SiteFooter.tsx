/**
 * Global site footer. Carries the brand attribution required by Arc's brand
 * guidelines: the official Arc logo (unmodified, from Arc's brand assets) used
 * descriptively to indicate "built on Arc", the trademark line, and an explicit
 * non-affiliation disclaimer so nothing implies a formal endorsement by Circle.
 *
 * The logo is the official file — never recolored or distorted. Two variants
 * are shipped (light/dark background) and swapped by theme via `dark:` (the app
 * uses darkMode: "class").
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 px-6 py-6 text-center">
      <p className="flex items-center justify-center gap-2 font-mono text-[11px] leading-relaxed text-slate-500">
        <span>Built on</span>
        <a
          href="https://www.arc.io"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Arc"
          className="inline-flex items-center hover:opacity-80"
        >
          {/* standard mark for light backgrounds */}
          <img src="/arc-logo.webp" alt="Arc" className="inline h-4 w-auto align-middle dark:hidden" />
          {/* light mark for dark backgrounds */}
          <img src="/arc-logo-ondark.svg" alt="Arc" className="hidden h-4 w-auto align-middle dark:inline-block" />
        </a>
        <span>· Settled in USDC</span>
      </p>
      <p className="mx-auto mt-2 max-w-xl font-mono text-[10px] leading-relaxed text-slate-400">
        Arc is a trademark of Circle Internet Group, Inc. FreelanceBot is an
        independent project, not affiliated with or endorsed by Circle.
      </p>
    </footer>
  );
}
