import type { ArticleJson, SavedArticle } from "@/types/article";

/** Wikipedia infobox portrait crop (width : height). */
export const HEADSHOT_CROP_ASPECT = 220 / 280;

export const HEADSHOT_OUTPUT = {
  width: 440,
  height: 560,
} as const;

export function isHeadshotDataUrl(url: string | undefined | null): boolean {
  const u = url?.trim();
  return Boolean(u && u.startsWith("data:image/"));
}

/** Use stored headshot on the infobox when article JSON lost the image URL. */
export function applyHeadshotToArticle(
  articleJson: ArticleJson,
  headshotDataUrl?: string | null,
): ArticleJson {
  const fromStore = headshotDataUrl?.trim();
  const fromInfobox = articleJson.infobox.imageUrl?.trim();
  const url = isHeadshotDataUrl(fromStore)
    ? fromStore!
    : isHeadshotDataUrl(fromInfobox)
      ? fromInfobox!
      : "";
  if (!url) return articleJson;
  if (articleJson.infobox.imageUrl === url) return articleJson;
  return {
    ...articleJson,
    infobox: { ...articleJson.infobox, imageUrl: url },
  };
}

/** Set or clear the infobox portrait (stored headshot + infobox image stay in sync). */
export function updateArticleHeadshot(
  articleJson: ArticleJson,
  headshotDataUrl?: string | null,
): ArticleJson {
  const trimmed = headshotDataUrl?.trim() ?? "";
  if (!trimmed) {
    if (!articleJson.infobox.imageUrl?.trim()) return articleJson;
    return {
      ...articleJson,
      infobox: { ...articleJson.infobox, imageUrl: "" },
    };
  }
  return applyHeadshotToArticle(articleJson, trimmed);
}

export function withHeadshotOnSaved(saved: SavedArticle): SavedArticle {
  return {
    ...saved,
    articleJson: applyHeadshotToArticle(saved.articleJson, saved.headshotDataUrl),
  };
}
