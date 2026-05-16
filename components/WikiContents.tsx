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
      <div id="toc" className="wiki-contents wiki-contents--collapsed">
        <button type="button" className="wiki-contents-toggle" onClick={onToggle}>
          show
        </button>
      </div>
    );
  }

  return (
    <div id="toc" className="wiki-contents">
      <div className="wiki-contents-header">
        <span className="wiki-contents-title">Contents</span>
        <button type="button" className="wiki-contents-toggle" onClick={onToggle}>
          [hide]
        </button>
      </div>
      <ol className="wiki-contents-list">
        {sections.map((s, i) => (
          <li key={s.id} className="wiki-contents-item">
            <a
              href={`#${s.id}`}
              className="wiki-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="wiki-contents-num">{i + 1}</span>
              <span className="wiki-contents-label">{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
