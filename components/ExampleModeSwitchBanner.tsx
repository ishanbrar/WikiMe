import type { ArticleMode } from "@/types/article";

export function ArticleModeSwitchBanner({
  currentMode,
  subjectName,
  isExample,
}: {
  currentMode: ArticleMode;
  subjectName?: string;
  isExample?: boolean;
}) {
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
      </div>
    </div>
  );
}
