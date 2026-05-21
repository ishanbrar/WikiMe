"use client";

import { useMemo, useState } from "react";
import type { ArticleJson } from "@/types/article";
import {
  listArticleLinks,
  removeArticleLink,
  resolveLinkHref,
  updateLinkDestination,
  upsertArticleLink,
  type ArticleLinkEntry,
} from "@/lib/articleWikiLinks";

export function ArticleWikiLinksEditor({
  article,
  onArticleChange,
  disabled,
}: {
  article: ArticleJson;
  onArticleChange: (a: ArticleJson) => void;
  disabled?: boolean;
}) {
  const links = useMemo(() => listArticleLinks(article), [article]);
  const [expanded, setExpanded] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");
  const [newDestination, setNewDestination] = useState("");

  const addLink = () => {
    const phrase = newPhrase.trim();
    if (!phrase) return;
    onArticleChange(
      upsertArticleLink(
        article,
        phrase,
        newDestination.trim() || phrase,
      ),
    );
    setNewPhrase("");
    setNewDestination("");
    setExpanded(true);
  };

  const removeLink = (entry: ArticleLinkEntry) => {
    onArticleChange(removeArticleLink(article, entry));
  };

  const setDestination = (entry: ArticleLinkEntry, destination: string) => {
    onArticleChange(updateLinkDestination(article, entry, destination));
  };

  return (
    <div className="article-links-editor">
      <button
        type="button"
        className="article-links-editor-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="article-links-editor-toggle-label">
          Links
          <span className="article-links-editor-count">
            ({links.length})
          </span>
        </span>
        <span className="article-links-editor-chevron" aria-hidden>
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {!expanded && links.length > 0 && (
        <p className="article-links-editor-collapsed-hint">
          Expand to edit where linked phrases go (Wikipedia or custom URLs).
        </p>
      )}

      {expanded && (
        <>
          <p className="article-links-editor-hint">
            Text in your article stays as written. Set where each phrase links
            (Wikipedia title, e.g. <code>Harvard University</code>, or URL, e.g.{" "}
            <code>https://example.com/page</code>). You can also use{" "}
            <code>[[Destination|visible text]]</code> in paragraphs.
          </p>

          {links.length === 0 ? (
            <p className="article-links-editor-empty">No links yet.</p>
          ) : (
            <ul className="article-links-editor-list">
              {links.map((entry) => (
                <li key={entry.id} className="article-links-editor-row">
                  <div className="article-links-editor-row-main">
                    <span className="article-links-editor-badge">
                      {entry.source === "inline" ? "In text" : "Auto"}
                    </span>
                    <span
                      className="article-links-editor-term"
                      title="Text shown in article"
                    >
                      {entry.term}
                    </span>
                    <span className="article-links-editor-arrow" aria-hidden>
                      →
                    </span>
                    <input
                      type="text"
                      className="article-links-editor-input article-links-editor-input--dest"
                      value={entry.destination}
                      disabled={disabled}
                      aria-label={`Link target for ${entry.term}`}
                      placeholder="Wikipedia title or URL"
                      onChange={(e) =>
                        setDestination(entry, e.target.value)
                      }
                    />
                    <a
                      href={resolveLinkHref(entry.destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-links-editor-preview"
                    >
                      Preview
                    </a>
                  </div>
                  <button
                    type="button"
                    className="article-links-editor-remove"
                    disabled={disabled}
                    onClick={() => removeLink(entry)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="article-links-editor-add">
            <p className="article-links-editor-add-label">Add link</p>
            <div className="article-links-editor-add-fields">
              <input
                type="text"
                className="article-links-editor-input"
                placeholder="Phrase in article (e.g. Stanford University)"
                value={newPhrase}
                disabled={disabled}
                onChange={(e) => setNewPhrase(e.target.value)}
              />
              <input
                type="text"
                className="article-links-editor-input"
                placeholder="Wikipedia title or URL (optional)"
                value={newDestination}
                disabled={disabled}
                onChange={(e) => setNewDestination(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={disabled || !newPhrase.trim()}
                onClick={addLink}
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
