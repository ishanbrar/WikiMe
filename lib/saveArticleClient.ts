import { parseJsonResponse } from "@/lib/apiClient";
import { adminTestHeaders, apiErrorMessage, type ApiErrorBody } from "@/lib/adminFetch";
import { formatUnknownError } from "@/lib/formatError";
import { fetchWithTimeout } from "@/lib/fetchTimeout";
import { buildArticleUrl } from "@/lib/articlePaths";
import { isTransientHttpStatus, withTransientRetry } from "@/lib/transientRetry";
import type { SavedArticle } from "@/types/article";

export type SaveArticleResult =
  | { ok: true; slug: string; url: string; shortLink: boolean }
  | { ok: false; error: string };

export async function saveArticleToServer(
  article: SavedArticle,
  options?: { isAdmin?: boolean },
): Promise<SaveArticleResult> {
  try {
    return await withTransientRetry(
      async () => {
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
              alternateSlug: article.alternateSlug,
            }),
          },
          45_000,
        );
        if (isTransientHttpStatus(res.status)) {
          await res.text().catch(() => "");
          throw new Error(`Save article API returned HTTP ${res.status} (transient).`);
        }
        const data = await parseJsonResponse<
          ApiErrorBody & {
            slug?: string;
            url?: string;
            shortLink?: boolean;
          }
        >(res);
        if (!res.ok) {
          return { ok: false, error: apiErrorMessage(data, res) };
        }
        const slug = data.slug!;
        const shortLink = data.shortLink ?? false;
        const url = data.url ?? buildArticleUrl(slug, shortLink);
        return { ok: true, slug, url, shortLink };
      },
      { maxAttempts: 4, baseDelayMs: 800, label: "saveArticle" },
    );
  } catch (e) {
    return { ok: false, error: formatUnknownError(e) };
  }
}
