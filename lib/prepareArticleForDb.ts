import type { SavedArticle } from "@/types/article";

const MAX_HEADSHOT_CHARS = 120_000;

/** Shrink payloads so saves succeed on Vercel/Supabase (skip huge base64 blobs). */
export function prepareArticleForDb(article: SavedArticle): SavedArticle {
  const next = { ...article, articleJson: { ...article.articleJson, infobox: { ...article.articleJson.infobox } } };

  if (next.headshotDataUrl && next.headshotDataUrl.length > MAX_HEADSHOT_CHARS) {
    next.headshotDataUrl = undefined;
  }

  const img = next.articleJson.infobox.imageUrl;
  if (img.startsWith("data:") && img.length > MAX_HEADSHOT_CHARS) {
    next.articleJson.infobox.imageUrl = "";
  }

  return next;
}
