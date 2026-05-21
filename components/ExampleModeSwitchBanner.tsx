import Link from "next/link";
import type { ArticleMode } from "@/types/article";

export function ArticleModeSwitchBanner({
  currentMode,
  alternateSlug,
  subjectName,
  isExample,
}: {
  currentMode: ArticleMode;
  alternateSlug: string;
  subjectName?: string;
  isExample?: boolean;
}) {
  const targetMode: ArticleMode =
    currentMode === "creative" ? "realism" : "creative";
  const targetLabel = targetMode === "creative" ? "Creative" : "Realism";
  const currentLabel = currentMode === "creative" ? "Creative" : "Realism";

  return (
    <div className="example-mode-banner no-print" role="region" aria-label="Article versions">
      <div className="example-mode-banner-inner">
        <p className="example-mode-banner-eyebrow">
          {isExample ? "Maya Chen · WikiMe demo" : subjectName || "WikiMe article"}
        </p>
        <p className="example-mode-banner-text">
          You&apos;re reading the <strong>{currentLabel}</strong> version
          {isExample ? " of the example article" : " of this biography"}.
        </p>
        <Link
          href={`/a/${alternateSlug}`}
          className={`example-mode-banner-btn example-mode-banner-btn--${targetMode}`}
        >
          View {targetLabel} version
        </Link>
      </div>
    </div>
  );
}
