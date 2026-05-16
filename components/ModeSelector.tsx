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
    <div className="grid md:grid-cols-2 gap-4">
      {cards.map((c) => (
        <button
          key={c.mode}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(c.mode)}
          className={`text-left p-5 rounded-xl border-2 transition ${
            value === c.mode
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
        >
          <h3 className="font-semibold text-slate-900">{c.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
        </button>
      ))}
    </div>
  );
}
