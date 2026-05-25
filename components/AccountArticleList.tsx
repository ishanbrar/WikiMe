"use client";

import Link from "next/link";
import { useState } from "react";
import { articlePath } from "@/lib/articlePaths";
import { hapticSuccess } from "@/lib/haptics";
import type { ArticleListItem } from "@/types/article";

export function AccountArticleList({
  articles,
  appBase,
}: {
  articles: ArticleListItem[];
  appBase: string;
}) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [customOnly, setCustomOnly] = useState(false);
  const visibleArticles = customOnly
    ? articles.filter((article) => article.shortLink)
    : articles;

  const copyLink = async (article: ArticleListItem) => {
    const url = `${appBase}${articlePath(article.slug, article.shortLink)}`;
    await navigator.clipboard.writeText(url);
    hapticSuccess();
    setCopiedSlug(article.slug);
    window.setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <>
      <div className="article-filter-bar" aria-label="Article filters">
        <button
          type="button"
          className={`article-filter-btn ${!customOnly ? "article-filter-btn--active" : ""}`}
          onClick={() => setCustomOnly(false)}
        >
          All
        </button>
        <button
          type="button"
          className={`article-filter-btn ${customOnly ? "article-filter-btn--active" : ""}`}
          onClick={() => setCustomOnly(true)}
        >
          Custom URLs
        </button>
        <span className="article-filter-count">
          {visibleArticles.length} of {articles.length}
        </span>
      </div>
      {visibleArticles.length === 0 ? (
        <p className="account-empty-hint">No articles match this filter.</p>
      ) : (
        <ul className="account-list">
          {visibleArticles.map((a) => {
            const publicPath = articlePath(a.slug, a.shortLink);
            return (
              <li key={a.id} className="account-list-item">
                <div className="account-list-thumb-wrap">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.imageUrl} alt="" className="account-list-thumb" />
                  ) : (
                    <span
                      className="account-list-thumb account-list-thumb--placeholder"
                      aria-hidden
                    >
                      {a.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="account-list-body">
                  <Link href={publicPath} className="account-list-title">
                    {a.title}
                  </Link>
                  <p className="account-list-meta">
                    {a.mode === "creative" ? "Creative" : "Realism"} · Updated{" "}
                    {new Date(a.updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="account-list-url">
                    {appBase}
                    {publicPath}
                  </p>
                  <div className="account-list-actions">
                    <button
                      type="button"
                      className="btn-secondary text-xs account-copy-btn"
                      onClick={() => void copyLink(a)}
                    >
                      {copiedSlug === a.slug ? "Copied!" : "Copy link"}
                    </button>
                    <Link
                      href={`/article?slug=${a.slug}`}
                      className="btn-secondary text-xs account-edit"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
