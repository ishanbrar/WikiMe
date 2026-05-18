"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeArticleSlug } from "@/lib/articleSlug";

export function AdminSlugEditor({
  articleId,
  slug,
  articleUrl,
}: {
  articleId: string;
  slug: string;
  articleUrl: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(slug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = () => {
    setValue(slug);
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articles/slug", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articleId, slug: value }),
      });
      const data = (await res.json()) as { error?: string; slug?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update link");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="admin-slug-view">
        <a
          href={articleUrl}
          className="admin-slug-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          /a/{slug}
        </a>
        <button
          type="button"
          className="admin-slug-edit-btn"
          onClick={() => {
            setValue(slug);
            setEditing(true);
          }}
        >
          Edit link
        </button>
      </div>
    );
  }

  return (
    <div className="admin-slug-edit">
      <label className="admin-slug-label" htmlFor={`slug-${articleId}`}>
        Public path
      </label>
      <div className="admin-slug-input-row">
        <span className="admin-slug-prefix">/a/</span>
        <input
          id={`slug-${articleId}`}
          type="text"
          className="admin-slug-input"
          value={value}
          onChange={(e) => setValue(normalizeArticleSlug(e.target.value))}
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {error && (
        <p className="admin-slug-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-slug-actions">
        <button
          type="button"
          className="btn-primary admin-slug-save"
          onClick={save}
          disabled={busy || !value.trim()}
        >
          {busy ? "Saving…" : "Save link"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={cancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
