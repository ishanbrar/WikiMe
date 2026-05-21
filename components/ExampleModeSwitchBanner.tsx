import Link from "next/link";
import type { ArticleMode } from "@/types/article";

export function ExampleModeSwitchBanner({
  currentMode,
  alternateSlug,
}: {
  currentMode: ArticleMode;
  alternateSlug: string;
}) {
  const targetMode: ArticleMode =
    currentMode === "creative" ? "realism" : "creative";
  const targetLabel = targetMode === "creative" ? "Creative" : "Realism";

  return (
    <div className="example-mode-banner no-print" role="region" aria-label="Example versions">
      <div className="example-mode-banner-inner">
        <p className="example-mode-banner-eyebrow">
          Maya Chen · WikiMe demo
        </p>
        <p className="example-mode-banner-text">
          You&apos;re reading the{" "}
          <strong>{currentMode === "creative" ? "Creative" : "Realism"}</strong>{" "}
          example article.
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
