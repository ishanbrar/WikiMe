"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import type { ArticleJson } from "@/types/article";
import { buildShareUrl, encodeArticleForUrl, buildEncodedShareUrl } from "@/lib/share";
import type { SavedArticle } from "@/types/article";

export function ExportControls({
  article,
  saved,
  printTargetId,
  onSave,
  disabled = false,
}: {
  article: ArticleJson;
  saved: SavedArticle | null;
  printTargetId: string;
  onSave: () => Promise<string | null>;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");

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
  };

  const printPdf = () => {
    window.print();
    setStatus("Use your browser print dialog to save as PDF.");
  };

  const exportPng = async () => {
    const el = document.getElementById(printTargetId);
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { pixelRatio: 1.5, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${article.title.replace(/\s+/g, "_")}.png`;
      a.click();
      setStatus("PNG downloaded.");
    } catch {
      setStatus("PNG export failed for this article size.");
    }
  };

  const copyShare = async () => {
    const slug = await onSave();
    if (slug) {
      const url = buildShareUrl(slug);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setStatus("Share link copied.");
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
  };

  return (
    <div className={`export-controls no-print ${disabled ? "opacity-60" : ""}`}>
      <button type="button" className="btn-secondary" onClick={printPdf} disabled={disabled}>
        Print / Save as PDF
      </button>
      <button type="button" className="btn-secondary" onClick={copyText} disabled={disabled}>
        Copy article text
      </button>
      <button type="button" className="btn-secondary" onClick={copyShare} disabled={disabled}>
        Copy share link
      </button>
      <button type="button" className="btn-secondary" onClick={exportPng} disabled={disabled}>
        Export PNG
      </button>
      {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
      {shareUrl && (
        <p className="text-xs text-gray-500 mt-1 break-all">{shareUrl}</p>
      )}
    </div>
  );
}
