import { adminTestHeaders, apiErrorMessage, type ApiErrorBody } from "@/lib/adminFetch";
import { fetchWithTimeout } from "@/lib/fetchTimeout";
import { buildArticleUrl } from "@/lib/articlePaths";
import type { SavedArticle } from "@/types/article";

export type SaveArticleResult =
  | { ok: true; slug: string; url: string; shortLink: boolean }
  | { ok: false; error: string };

export async function saveArticleToServer(
  article: SavedArticle,
  options?: { isAdmin?: boolean },
): Promise<SaveArticleResult> {
  try {
    const res = await fetchWithTimeout(
      "/api/articles",
      {
        method: "POST",
        headers: adminTestHeaders(Boolean(options?.isAdmin)),
        body: JSON.stringify({
          id: article.id,
          slug: article.slug,
          articleJson: article.articleJson,
          mode: article.mode,
          intake: article.intake,
          headshotDataUrl: article.headshotDataUrl,
        }),
      },
      45_000,
    );
    const data = (await res.json()) as ApiErrorBody & {
      slug?: string;
      url?: string;
      shortLink?: boolean;
    };
    if (!res.ok) {
      return { ok: false, error: apiErrorMessage(data, res) };
    }
    const slug = data.slug!;
    const shortLink = data.shortLink ?? false;
    const url = data.url ?? buildArticleUrl(slug, shortLink);
    return { ok: true, slug, url, shortLink };
  } catch {
    return { ok: false, error: "Network error while saving" };
  }
}
