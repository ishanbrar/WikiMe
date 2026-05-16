"use client";

import { useState } from "react";
import type { ArticleJson, AppearanceSettings } from "@/types/article";
import { WikiInfobox } from "@/components/WikiInfobox";
import { WikiContents } from "@/components/WikiContents";
import { AppearancePanel } from "@/components/AppearancePanel";
import { WikiLinkedText } from "@/components/WikiLinkedText";
import { normalizeWikiSections } from "@/lib/wikiSections";

export function WikiArticlePage({
  article,
  subjectName,
  editable,
  onArticleChange,
  appearance,
  onAppearanceChange,
  printId = "wiki-article-print",
}: {
  article: ArticleJson;
  subjectName: string;
  editable?: boolean;
  onArticleChange?: (a: ArticleJson) => void;
  appearance: AppearanceSettings;
  onAppearanceChange: (s: AppearanceSettings) => void;
  printId?: string;
}) {
  const [tocHidden, setTocHidden] = useState(false);
  const [appearanceHidden, setAppearanceHidden] = useState(false);

  const themeClass =
    appearance.color === "dark"
      ? "wiki-theme-dark"
      : appearance.color === "light"
        ? "wiki-theme-light"
        : "";

  const sizeClass =
    appearance.textSize === "small"
      ? "wiki-text-small"
      : appearance.textSize === "large"
        ? "wiki-text-large"
        : "";

  const widthClass = appearance.width === "wide" ? "wiki-width-wide" : "";

  const displayArticle = {
    ...article,
    sections: normalizeWikiSections(article.sections),
  };

  const updateSection = (id: string, paragraphs: string[]) => {
    if (!onArticleChange) return;
    onArticleChange({
      ...article,
      sections: article.sections.map((s) =>
        s.id === id ? { ...s, paragraphs } : s,
      ),
    });
  };

  return (
    <div
      id={printId}
      className={`wiki-page ${themeClass} ${sizeClass} ${widthClass}`}
    >
      <header className="wiki-site-header">
        <div className="wiki-site-brand">WikiMe</div>
        <nav className="wiki-site-nav" aria-label="Site">
          <span>Article</span>
          <span className="wiki-muted">Talk</span>
        </nav>
      </header>

      <div className="wiki-article-header">
        <h1 className="wiki-title">{displayArticle.title}</h1>
        {displayArticle.subtitle && (
          <p className="wiki-subtitle">{displayArticle.subtitle}</p>
        )}
        <nav className="wiki-tabs" aria-label="Page tabs">
          {["Article", "Talk", "Read", "Edit", "View history", "Tools"].map(
            (tab, i) => (
              <span
                key={tab}
                className={i === 0 ? "wiki-tab wiki-tab-active" : "wiki-tab"}
              >
                {tab}
              </span>
            ),
          )}
        </nav>
      </div>

      <div className="wiki-layout">
        <main className="wiki-main">
          <div className="wiki-body">
            <div className="wiki-toc-float">
              <WikiContents
                sections={displayArticle.sections}
                hidden={tocHidden}
                onToggle={() => setTocHidden(!tocHidden)}
              />
            </div>

            <div className="wiki-infobox-float">
            <WikiInfobox
              infobox={displayArticle.infobox}
              properNouns={displayArticle.properNouns}
              subjectName={subjectName}
              editable={editable}
              onChange={
                onArticleChange
                  ? (infobox) => onArticleChange({ ...article, infobox })
                  : undefined
              }
            />
          </div>

          <div className="wiki-lead">
            {displayArticle.summaryLead.map((p, i) => (
              <p key={i}>
                {editable ? (
                  <textarea
                    className="wiki-edit-area w-full"
                    value={p}
                    onChange={(e) => {
                      const lead = [...displayArticle.summaryLead];
                      lead[i] = e.target.value;
                      onArticleChange?.({ ...article, summaryLead: lead });
                    }}
                  />
                ) : (
                  <WikiLinkedText
                    text={p}
                    properNouns={displayArticle.properNouns}
                    subjectName={subjectName}
                  />
                )}
              </p>
            ))}
          </div>

          {displayArticle.sections.map((section) => (
            <section key={section.id} id={section.id} className="wiki-section">
              <h2 className="wiki-section-title">
                <span className="wiki-section-anchor">§</span> {section.title}
              </h2>
              {section.paragraphs.map((para, pi) => (
                <p key={pi} className="wiki-paragraph">
                  {editable ? (
                    <textarea
                      className="wiki-edit-area w-full"
                      value={para}
                      onChange={(e) => {
                        const paragraphs = [...section.paragraphs];
                        paragraphs[pi] = e.target.value;
                        updateSection(section.id, paragraphs);
                      }}
                    />
                  ) : (
                    <WikiLinkedText
                      text={para}
                      properNouns={displayArticle.properNouns}
                      subjectName={subjectName}
                    />
                  )}
                </p>
              ))}
              {section.subsections?.map((sub, si) => (
                <div key={`${section.id}-sub-${si}`} className="wiki-subsection">
                  <h3 className="wiki-subsection-title">
                    <span className="wiki-subsection-heading">{sub.title}</span>
                  </h3>
                  {sub.paragraphs.map((para, pi) => (
                    <p key={pi} className="wiki-paragraph">
                      <WikiLinkedText
                        text={para}
                        properNouns={displayArticle.properNouns}
                        subjectName={subjectName}
                      />
                    </p>
                  ))}
                </div>
              ))}
            </section>
          ))}

          {article.seeAlso.length > 0 && (
            <section id="see-also" className="wiki-section">
              <h2 className="wiki-section-title">See also</h2>
              <ul>
                {article.seeAlso.map((item, i) => (
                  <li key={i}>
                    <WikiLinkedText
                      text={item}
                      properNouns={displayArticle.properNouns}
                      subjectName={subjectName}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {article.references.length > 0 && (
            <section id="references" className="wiki-section">
              <h2 className="wiki-section-title">References</h2>
              <ol className="wiki-references">
                {article.references.map((ref) => (
                  <li key={ref.label} id={`ref-${ref.label}`}>
                    <span className="wiki-ref-label">^{ref.label}</span>{" "}
                    {ref.url ? (
                      <a href={ref.url} className="wiki-link external" target="_blank" rel="noopener noreferrer">
                        {ref.title}
                      </a>
                    ) : (
                      <cite>{ref.title}</cite>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {article.externalLinks.length > 0 && (
            <section id="external-links" className="wiki-section">
              <h2 className="wiki-section-title">External links</h2>
              <ul>
                {article.externalLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      className="wiki-link external"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          </div>
        </main>

        <aside className="wiki-right">
          <AppearancePanel
            settings={appearance}
            hidden={appearanceHidden}
            onSettingsChange={onAppearanceChange}
            onToggle={() => setAppearanceHidden(!appearanceHidden)}
          />
        </aside>
      </div>
    </div>
  );
}
