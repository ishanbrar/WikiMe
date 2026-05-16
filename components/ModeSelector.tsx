"use client";

import type { ArticleMode } from "@/types/article";

export function ModeSelector({
  value,
  onChange,
  readOnly,
}: {
  value: ArticleMode;
  onChange: (m: ArticleMode) => void;
  readOnly?: boolean;
}) {
  const cards: { mode: ArticleMode; title: string; desc: string }[] = [
    {
      mode: "realism",
      title: "Realism Mode",
      desc: "Grounded biography from your Q&A, screenshots, and pasted profile text. No invented major facts.",
    },
    {
      mode: "creative",
      title: "Creative Mode",
      desc: "Builds a long, legendary fictional biography from your inputs — a new narrative angle every time you generate.",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4" role="group" aria-label="Article mode">
      {cards.map((c) => {
        const selected = value === c.mode;
        const dimmed = !readOnly && !selected;
        const isCreative = c.mode === "creative";

        return (
          <button
            key={c.mode}
            type="button"
            disabled={readOnly}
            aria-pressed={selected}
            onClick={() => !readOnly && onChange(c.mode)}
            className={[
              "mode-card text-left p-5 rounded-xl border-2 transition-all duration-200",
              isCreative ? "mode-card--creative" : "mode-card--realism",
              selected ? "mode-card--selected" : "",
              dimmed ? "mode-card--dimmed" : "",
              readOnly ? "cursor-default" : "cursor-pointer",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm mode-card-desc">{c.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
