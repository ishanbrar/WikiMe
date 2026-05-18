"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticleJson } from "@/types/article";
import { buildShareUrl, encodeArticleForUrl, buildEncodedShareUrl } from "@/lib/share";
import type { SavedArticle } from "@/types/article";

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  );
}

export function ExportControls({
  article,
  saved,
  printTargetId,
  onSave,
  disabled = false,
  inline = false,
}: {
  article: ArticleJson;
  saved: SavedArticle | null;
  printTargetId: string;
  onSave: () => Promise<string | null>;
  disabled?: boolean;
  /** Render Share button inline in the article toolbar row */
  inline?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const plainText = [
    article.title,
    "",
    ...article.summaryLead,
    "",
    ...article.sections.flatMap((s) => [
      `== ${s.title} ==`,
      ...s.paragraphs,
      "",
    ]),
  ].join("\n");

  const copyText = async () => {
    await navigator.clipboard.writeText(plainText);
    setStatus("Article text copied.");
    setOpen(false);
  };

  const printPdf = () => {
    window.print();
    setStatus("Use your browser print dialog to save as PDF.");
    setOpen(false);
  };

  const exportPng = async () => {
    const el = document.getElementById(printTargetId);
    if (!el) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { pixelRatio: 1.5, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${article.title.replace(/\s+/g, "_")}.png`;
      a.click();
      setStatus("PNG downloaded.");
    } catch {
      setStatus("PNG export failed for this article size.");
    }
    setOpen(false);
  };

  const copyShare = async () => {
    const slug = await onSave();
    if (slug) {
      const url = buildShareUrl(slug, saved?.shortLink ?? false);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setStatus("Share link copied.");
      setOpen(false);
      return;
    }
    if (saved) {
      const encoded = encodeArticleForUrl(saved);
      if (encoded) {
        const url = buildEncodedShareUrl(encoded);
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setStatus("Encoded share link copied (no server save).");
      } else {
        setStatus("Article too large for URL sharing. Save locally instead.");
      }
    }
    setOpen(false);
  };

  return (
    <div
      className={`export-controls no-print ${inline ? "export-controls--inline" : ""} ${disabled ? "opacity-60" : ""}`}
    >
      <div className="share-menu" ref={menuRef}>
        <button
          type="button"
          className="btn-secondary share-menu-trigger"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <ShareIcon />
          <span>Share</span>
        </button>
        {open && (
          <div className="share-menu-dropdown" role="menu">
            <button type="button" role="menuitem" onClick={printPdf} disabled={disabled}>
              Print / Save as PDF
            </button>
            <button type="button" role="menuitem" onClick={copyText} disabled={disabled}>
              Copy article text
            </button>
            <button type="button" role="menuitem" onClick={copyShare} disabled={disabled}>
              Copy share link
            </button>
            <button type="button" role="menuitem" onClick={exportPng} disabled={disabled}>
              Export PNG
            </button>
          </div>
        )}
      </div>
      {!inline && status && (
        <p className="text-sm text-gray-600 mt-2">{status}</p>
      )}
      {!inline && shareUrl && (
        <p className="text-xs text-gray-500 mt-1 break-all">{shareUrl}</p>
      )}
    </div>
  );
}
