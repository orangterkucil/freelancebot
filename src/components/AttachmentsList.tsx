import { FileIcon, ImageIcon, FileText, Download, Lock } from "lucide-react";
import type { Attachment } from "@/lib/orders";

/**
 * Read-only display of an order's attachments.
 *
 * Privacy:
 *   - If `isPublic` is true (job is on the marketplace), anyone viewing can
 *     see the attachments — they were posted as part of the brief.
 *   - If `isPublic` is false and `isViewerParty` is false, we hide everything
 *     and show a "lock" notice. (Server still trusts the URL — defense in
 *     depth lives in MVP 2 with signed URLs.)
 */
export function AttachmentsList({
  attachments,
  isPublic,
  isViewerParty,
  className = "",
}: {
  attachments: Attachment[];
  isPublic: boolean;
  isViewerParty: boolean;
  className?: string;
}) {
  if (attachments.length === 0) return null;

  const canSee = isPublic || isViewerParty;

  if (!canSee) {
    return (
      <div className={"rounded-xl border border-white/10 bg-white/[0.02] p-3 " + className}>
        <div className="flex items-center gap-2 text-cream/50">
          <Lock className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {attachments.length} attachment{attachments.length === 1 ? "" : "s"} · sign in as a party to view
          </span>
        </div>
      </div>
    );
  }

  const images = attachments.filter((a) => a.content_type.startsWith("image/"));
  const files  = attachments.filter((a) => !a.content_type.startsWith("image/"));

  return (
    <div className={"space-y-3 " + className}>
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.filename}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/90 to-transparent px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-cream/80">
                {a.filename}
              </span>
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((a) => (
            <li key={a.url}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors hover:bg-white/[0.08]"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 text-cream/80">
                  <FileTypeIcon contentType={a.content_type} />
                  <span className="truncate font-mono text-xs">{a.filename}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
                    {formatBytes(a.size_bytes)}
                  </span>
                  <Download className="h-3.5 w-3.5 text-cream/40" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-cream/50" />;
  if (contentType.includes("pdf"))      return <FileText className="h-4 w-4 text-cream/50" />;
  if (contentType.includes("text"))     return <FileText className="h-4 w-4 text-cream/50" />;
  return <FileIcon className="h-4 w-4 text-cream/50" />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
