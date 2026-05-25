"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSlugEditor } from "@/components/AdminSlugEditor";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import type { AdminArticleLogRow } from "@/lib/adminArticles";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminArticleTable({
  articles,
}: {
  articles: AdminArticleLogRow[];
}) {
  const router = useRouter();
  const [customOnly, setCustomOnly] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const liveArticles = useMemo(
    () => articles.filter((article) => !deletedIds.has(article.id)),
    [articles, deletedIds],
  );
  const visibleArticles = customOnly
    ? liveArticles.filter((article) => article.shortLink)
    : liveArticles;

  const deleteArticle = async (article: AdminArticleLogRow) => {
    const confirmed = window.confirm(
      `Delete "${article.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(article.id);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: article.id }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "Delete failed");
      }
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(article.id);
        return next;
      });
      hapticSuccess();
      startTransition(() => router.refresh());
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
      hapticError();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div
        className="article-filter-bar article-filter-bar--sticky"
        aria-label="Article filters"
      >
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
          {visibleArticles.length} of {liveArticles.length}
        </span>
      </div>

      {deleteError && (
        <p className="account-error" role="alert">
          {deleteError}
        </p>
      )}

      {visibleArticles.length === 0 ? (
        <p className="admin-muted">No articles match this filter.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Article title</th>
                <th scope="col">Actions</th>
                <th scope="col">Share link</th>
                <th scope="col">Account</th>
                <th scope="col">Mode</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleArticles.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={row.articleUrl}
                      className="admin-table-title"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="admin-actions-cell">
                    <Link href={`/article?slug=${encodeURIComponent(row.slug)}`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => void deleteArticle(row)}
                      disabled={deletingId === row.id || isPending}
                    >
                      {deletingId === row.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                  <td className="admin-slug-cell">
                    <AdminSlugEditor
                      articleId={row.id}
                      slug={row.slug}
                      articleUrl={row.articleUrl}
                      shortLink={row.shortLink}
                    />
                  </td>
                  <td>
                    {row.creatorEmail ? (
                      row.creatorEmail
                    ) : (
                      <span className="admin-guest">Guest (not signed in)</span>
                    )}
                  </td>
                  <td className="admin-mode">
                    {row.mode === "creative" ? "Creative" : "Realism"}
                  </td>
                  <td className="admin-when">{formatWhen(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
