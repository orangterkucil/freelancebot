"use client";

import { useRef, useState } from "react";
import { Upload, X, FileIcon, ImageIcon, FileText, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import type { Attachment } from "@/lib/orders";

const MAX_SIZE_MB = 8;
const MAX_FILES   = 6;
const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
];

export function FileDropzone({
  value,
  onChange,
  uploadedBy,
  pathPrefix = "drafts",
  disabled,
}: {
  value: Attachment[];
  onChange: (atts: Attachment[]) => void;
  uploadedBy: string;
  pathPrefix?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    setError(null);
    if (value.length + files.length > MAX_FILES) {
      setError(`Max ${MAX_FILES} files per order`);
      return;
    }
    for (const f of files) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${f.name} is over ${MAX_SIZE_MB} MB`);
        return;
      }
      if (!ACCEPTED_TYPES.includes(f.type) && f.type) {
        setError(`${f.name}: type ${f.type} not allowed`);
        return;
      }
    }

    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const uploaded: Attachment[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const objectPath = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const { error: upErr } = await sb.storage
          .from("attachments")
          .upload(objectPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from("attachments").getPublicUrl(objectPath);
        uploaded.push({
          filename:     file.name,
          url:          pub.publicUrl,
          size_bytes:   file.size,
          content_type: file.type || "application/octet-stream",
          uploaded_by:  uploadedBy,
          created_at:   new Date().toISOString(),
        });
      }
      onChange([...value, ...uploaded]);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx: number) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (disabled) return;
          handleFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={
          "cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors " +
          (drag ? "border-brand bg-sky-50" : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-brand hover:bg-sky-50/50") +
          (disabled ? " pointer-events-none opacity-50" : "")
        }
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
          disabled={disabled || busy}
        />
        <div className="flex flex-col items-center gap-2">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          ) : (
            <Upload className="h-5 w-5 text-slate-500" />
          )}
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-700">
            {busy ? "Uploading…" : "Drop files or click to upload"}
          </p>
          <p className="font-mono text-[10px] tracking-wide text-slate-400">
            Up to {MAX_FILES} files · {MAX_SIZE_MB} MB each · images, PDF, doc, csv, zip
          </p>
        </div>
      </div>

      {error && (
        <p className="font-mono text-[11px] text-rose-700">{error}</p>
      )}

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((a, i) => (
            <li
              key={a.url}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-brand"
              >
                <FileTypeIcon contentType={a.content_type} />
                <span className="truncate font-mono text-xs">{a.filename}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  {formatBytes(a.size_bytes)}
                </span>
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-colors hover:border-rose-400 hover:text-rose-600"
                  aria-label={`Remove ${a.filename}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-slate-400" />;
  if (contentType.includes("pdf"))      return <FileText className="h-4 w-4 text-slate-400" />;
  if (contentType.includes("text"))     return <FileText className="h-4 w-4 text-slate-400" />;
  return <FileIcon className="h-4 w-4 text-slate-400" />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
