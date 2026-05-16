"use client";

import Link from "next/link";
import { useState } from "react";
import type { ArticleListItem } from "@/types/article";

export function AccountArticleList({
  articles,
  appBase,
}: {
  articles: ArticleListItem[];
  appBase: string;
}) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyLink = async (slug: string) => {
    const url = `${appBase}/a/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <ul className="account-list">
      {articles.map((a) => (
        <li key={a.id} className="account-list-item">
          <div className="account-list-thumb-wrap">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" className="account-list-thumb" />
            ) : (
              <span className="account-list-thumb account-list-thumb--placeholder" aria-hidden>
                {a.title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="account-list-body">
            <Link href={`/a/${a.slug}`} className="account-list-title">
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
              {appBase}/a/{a.slug}
            </p>
            <div className="account-list-actions">
              <button
                type="button"
                className="btn-secondary text-xs account-copy-btn"
                onClick={() => void copyLink(a.slug)}
              >
                {copiedSlug === a.slug ? "Copied!" : "Copy link"}
              </button>
              <Link href={`/article?slug=${a.slug}`} className="btn-secondary text-xs account-edit">
                Edit
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
