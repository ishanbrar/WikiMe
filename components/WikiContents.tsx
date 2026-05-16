"use client";

import type { ArticleSection } from "@/types/article";

export function WikiContents({
  sections,
  hidden,
  onToggle,
}: {
  sections: ArticleSection[];
  hidden: boolean;
  onToggle: () => void;
}) {
  if (hidden) {
    return (
      <div className="wiki-contents">
        <button type="button" className="wiki-contents-toggle" onClick={onToggle}>
          show
        </button>
      </div>
    );
  }

  return (
    <div id="toc" className="wiki-contents">
      <div className="wiki-contents-header">
        <span className="font-bold">Contents</span>
        <button type="button" className="wiki-contents-toggle" onClick={onToggle}>
          hide
        </button>
      </div>
      <ol className="wiki-contents-list">
        {sections.map((s, i) => (
          <li
            key={s.id}
            className={
              i > 0 ? "wiki-contents-item" : "wiki-contents-item wiki-contents-top"
            }
          >
            <a
              href={`#${s.id}`}
              className="wiki-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {i + 1}. {s.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
