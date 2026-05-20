import type { ArticleJson, SavedArticle } from "@/types/article";
import { compressArticleFigureImages } from "@/lib/articleImages";
import { compressDataUrl } from "@/lib/compressImage";
import { applyHeadshotToArticle, isHeadshotDataUrl } from "@/lib/headshotForArticle";
import { UPLOAD_LIMITS } from "@/lib/prepareUploadImages";

const MAX_HEADSHOT_CHARS = 120_000;

/** Shrink payloads so saves succeed on Vercel/Supabase (recompress instead of dropping images). */
export async function prepareArticleForDb(
  article: SavedArticle,
): Promise<SavedArticle> {
  let headshot =
    article.headshotDataUrl?.trim() ||
    (isHeadshotDataUrl(article.articleJson.infobox.imageUrl)
      ? article.articleJson.infobox.imageUrl.trim()
      : "");

  if (headshot.length > MAX_HEADSHOT_CHARS) {
    try {
      headshot = await compressDataUrl(headshot, UPLOAD_LIMITS.headshot);
    } catch {
      headshot = "";
    }
  }

  let articleJson = applyHeadshotToArticle(
    {
      ...article.articleJson,
      infobox: {
        ...article.articleJson.infobox,
        imageUrl: headshot,
      },
    },
    headshot,
  );

  articleJson = await compressArticleFigureImages(articleJson);

  return {
    ...article,
    headshotDataUrl: headshot || undefined,
    articleJson,
  };
}
