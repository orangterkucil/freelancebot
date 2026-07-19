/**
 * Global site footer. Carries the brand attribution required by Arc's brand
 * guidelines: a descriptive "Built on Arc" reference (allowed), the trademark
 * line, and an explicit non-affiliation disclaimer so nothing implies a formal
 * endorsement by Circle. Uses the Arc name as text — not the logo — since the
 * official mark must come from the Circle Brand Kit unmodified.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 px-6 py-6 text-center">
      <p className="font-mono text-[11px] leading-relaxed text-slate-500">
        Built on{" "}
        <a
          href="https://www.arc.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Arc
        </a>{" "}
        · Settled in USDC
      </p>
      <p className="mx-auto mt-1.5 max-w-xl font-mono text-[10px] leading-relaxed text-slate-400">
        Arc is a trademark of Circle Internet Group, Inc. FreelanceBot is an
        independent project, not affiliated with or endorsed by Circle.
      </p>
    </footer>
  );
}
