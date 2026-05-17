"use client";

import type { ArticleMode } from "@/types/article";

export function HomeExampleModeTabs({
  value,
  onChange,
}: {
  value: ArticleMode;
  onChange: (mode: ArticleMode) => void;
}) {
  const tabs: { mode: ArticleMode; label: string }[] = [
    { mode: "realism", label: "Realism" },
    { mode: "creative", label: "Creative" },
  ];

  return (
    <div
      className="home-mode-tabs"
      role="tablist"
      aria-label="Example article mode"
    >
      {tabs.map((tab) => {
        const selected = value === tab.mode;
        const isCreative = tab.mode === "creative";
        return (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={selected}
            className={[
              "home-mode-tab",
              isCreative ? "home-mode-tab--creative" : "home-mode-tab--realism",
              selected ? "home-mode-tab--active" : "",
              isCreative && selected ? "home-mode-tab--creative-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onChange(tab.mode)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
