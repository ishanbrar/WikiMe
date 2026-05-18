import { buildArticleUrl } from "@/lib/articlePaths";
import type { SavedArticle } from "@/types/article";

export type SaveArticleResult =
  | { ok: true; slug: string; url: string; shortLink: boolean }
  | { ok: false; error: string };

export async function saveArticleToServer(
  article: SavedArticle,
): Promise<SaveArticleResult> {
  try {
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: article.id,
        slug: article.slug,
        articleJson: article.articleJson,
        mode: article.mode,
        intake: article.intake,
        headshotDataUrl: article.headshotDataUrl,
      }),
    });
    const data = (await res.json()) as {
      slug?: string;
      url?: string;
      shortLink?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Could not save article" };
    }
    const slug = data.slug!;
    const shortLink = data.shortLink ?? false;
    const url = data.url ?? buildArticleUrl(slug, shortLink);
    return { ok: true, slug, url, shortLink };
  } catch {
    return { ok: false, error: "Network error while saving" };
  }
}
