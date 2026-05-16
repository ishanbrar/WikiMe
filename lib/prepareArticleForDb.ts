import type { SavedArticle } from "@/types/article";
import { applyHeadshotToArticle, isHeadshotDataUrl } from "@/lib/headshotForArticle";

const MAX_HEADSHOT_CHARS = 120_000;

/** Shrink payloads so saves succeed on Vercel/Supabase (skip huge base64 blobs). */
export function prepareArticleForDb(article: SavedArticle): SavedArticle {
  let headshot =
    article.headshotDataUrl?.trim() ||
    (isHeadshotDataUrl(article.articleJson.infobox.imageUrl)
      ? article.articleJson.infobox.imageUrl.trim()
      : "");

  if (headshot.length > MAX_HEADSHOT_CHARS) {
    headshot = "";
  }

  const articleJson = applyHeadshotToArticle(
    {
      ...article.articleJson,
      infobox: {
        ...article.articleJson.infobox,
        imageUrl: headshot,
      },
    },
    headshot,
  );

  return {
    ...article,
    headshotDataUrl: headshot || undefined,
    articleJson,
  };
}
