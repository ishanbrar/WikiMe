"use client";

import { useMemo, useState } from "react";
import type { ArticleJson } from "@/types/article";
import {
  listArticleLinks,
  removeArticleLink,
  upsertAutoLink,
  updateAutoLinkTitle,
  wikiUrl,
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
  const [newPhrase, setNewPhrase] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const addAutoLink = () => {
    const phrase = newPhrase.trim();
    if (!phrase) return;
    onArticleChange(
      upsertAutoLink(article, phrase, newTitle.trim() || phrase),
    );
    setNewPhrase("");
    setNewTitle("");
  };

  const removeLink = (entry: ArticleLinkEntry) => {
    onArticleChange(removeArticleLink(article, entry));
  };

  const setTitle = (entry: ArticleLinkEntry, title: string) => {
    if (entry.source !== "auto") return;
    onArticleChange(updateAutoLinkTitle(article, entry.term, title));
  };

  return (
    <div className="article-links-editor">
      <h3 className="article-links-editor-title">Wikipedia links</h3>
      <p className="article-links-editor-hint">
        Auto-links match phrases in your article text. You can also type{" "}
        <code>[[Article title]]</code> or <code>[[Article title|visible text]]</code>{" "}
        directly in any paragraph while editing.
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
                {entry.source === "auto" ? (
                  <>
                    <input
                      type="text"
                      className="article-links-editor-input"
                      value={entry.term}
                      readOnly
                      aria-label="Phrase in article"
                    />
                    <span className="article-links-editor-arrow" aria-hidden>
                      →
                    </span>
                    <input
                      type="text"
                      className="article-links-editor-input"
                      value={entry.title}
                      disabled={disabled}
                      aria-label="Wikipedia article title"
                      onChange={(e) => setTitle(entry, e.target.value)}
                    />
                  </>
                ) : (
                  <span className="article-links-editor-inline">
                    <strong>{entry.term}</strong>
                    <span className="article-links-editor-meta">
                      → {entry.title}
                    </span>
                  </span>
                )}
                <a
                  href={wikiUrl(entry.title)}
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
        <p className="article-links-editor-add-label">Add auto-link</p>
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
            placeholder="Wikipedia title (optional)"
            value={newTitle}
            disabled={disabled}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={disabled || !newPhrase.trim()}
            onClick={addAutoLink}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
