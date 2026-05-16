import { getClientAppBaseUrl } from "@/lib/appUrl";
import type { SavedArticle } from "@/types/article";

export type SaveArticleResult =
  | { ok: true; slug: string; url: string }
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
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Could not save article" };
    }
    const slug = data.slug!;
    const url = data.url ?? `${getClientAppBaseUrl()}/a/${slug}`;
    return { ok: true, slug, url };
  } catch {
    return { ok: false, error: "Network error while saving" };
  }
}
