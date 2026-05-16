"use client";

import { useMemo, useState } from "react";
import type { ArticleJson, AppearanceSettings, IntakeData } from "@/types/article";
import { normalizeInfobox } from "@/lib/infoboxHelpers";
import { WikiInfobox } from "@/components/WikiInfobox";
import { WikiContents } from "@/components/WikiContents";
import { AppearancePanel } from "@/components/AppearancePanel";
import { WikiLinkedText } from "@/components/WikiLinkedText";
import { normalizeWikiSections } from "@/lib/wikiSections";
import { expandLinkTermsForInfobox } from "@/lib/wikipediaLinks";
import { splitSummaryLead } from "@/lib/splitLead";

export function WikiArticlePage({
  article,
  subjectName,
  editable,
  onArticleChange,
  appearance,
  onAppearanceChange,
  printId = "wiki-article-print",
  intake,
}: {
  article: ArticleJson;
  subjectName: string;
  intake?: IntakeData;
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

  const displayArticle = useMemo(() => {
    const infobox = intake
      ? normalizeInfobox(
          article.infobox as unknown as Record<string, unknown>,
          intake,
          article.infobox.imageUrl,
        )
      : article.infobox;
    return {
      ...article,
      infobox,
      sections: normalizeWikiSections(article.sections),
    };
  }, [article, intake]);

  const linkTerms = useMemo(
    () =>
      expandLinkTermsForInfobox(
        displayArticle.properNouns,
        displayArticle.infobox,
        subjectName,
      ),
    [displayArticle.properNouns, displayArticle.infobox, subjectName],
  );

  const { teaser: leadTeaser, rest: leadRest } = useMemo(() => {
    if (editable) {
      return { teaser: displayArticle.summaryLead, rest: [] as string[] };
    }
    return splitSummaryLead(displayArticle.summaryLead);
  }, [displayArticle.summaryLead, editable]);

  const renderLeadParagraph = (p: string, i: number, isFirstOverall: boolean) => (
    <p key={isFirstOverall ? `lead-${i}` : `lead-rest-${i}`}>
      {editable ? (
        <textarea
          className="wiki-edit-area w-full"
          value={p}
          onChange={(e) => {
            const lead = [...displayArticle.summaryLead];
            const idx = isFirstOverall ? i : i + leadTeaser.length;
            lead[idx] = e.target.value;
            onArticleChange?.({ ...article, summaryLead: lead });
          }}
        />
      ) : (
        <WikiLinkedText
          text={p}
          properNouns={linkTerms}
          subjectName={subjectName}
        />
      )}
    </p>
  );

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
              properNouns={linkTerms}
              subjectName={subjectName}
              editable={editable}
              onChange={
                onArticleChange
                  ? (infobox) => onArticleChange({ ...article, infobox })
                  : undefined
              }
            />
          </div>

            {leadTeaser.length > 0 && (
              <div className="wiki-lead wiki-lead-teaser">
                {leadTeaser.map((p, i) => renderLeadParagraph(p, i, true))}
              </div>
            )}

            {leadRest.length > 0 && (
              <div className="wiki-lead wiki-lead-rest">
                {leadRest.map((p, i) => renderLeadParagraph(p, i, false))}
              </div>
            )}

            <div className="wiki-sections-flow">
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
                      properNouns={linkTerms}
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
                        properNouns={linkTerms}
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
                      properNouns={linkTerms}
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
