import type { ArticleJson } from "@/types/article";
import {
  applySupplementalPhotos,
  type SupplementalPhoto,
} from "@/lib/articleFigures";
import { compressDataUrl } from "@/lib/compressImage";
import { UPLOAD_LIMITS } from "@/lib/prepareUploadImages";
import { isHeadshotDataUrl } from "@/lib/headshotForArticle";

export type ArticleImageMetrics = {
  sectionCount: number;
  figureCount: number;
  figuresWithDataUrl: number;
  infoboxHasImage: boolean;
  infoboxImageChars: number;
  headshotChars: number;
};

export function articleImageMetrics(
  article: ArticleJson,
  headshotDataUrl?: string,
): ArticleImageMetrics {
  const figures = article.sections.flatMap((s) => s.figures ?? []);
  const withUrl = figures.filter((f) => Boolean(f.imageUrl?.trim()));
  const dataUrls = withUrl.filter((f) => f.imageUrl.startsWith("data:image/"));
  const infobox = article.infobox.imageUrl?.trim() ?? "";
  return {
    sectionCount: article.sections.length,
    figureCount: figures.length,
    figuresWithDataUrl: dataUrls.length,
    infoboxHasImage: Boolean(infobox),
    infoboxImageChars: infobox.length,
    headshotChars: headshotDataUrl?.length ?? 0,
  };
}

export function formatArticleImageMetrics(m: ArticleImageMetrics): string {
  return [
    `sections=${m.sectionCount}`,
    `figures=${m.figureCount} (dataUrl=${m.figuresWithDataUrl})`,
    `infobox=${m.infoboxHasImage ? `${Math.round(m.infoboxImageChars / 1024)}KB` : "none"}`,
    `headshotStore=${m.headshotChars ? `${Math.round(m.headshotChars / 1024)}KB` : "none"}`,
  ].join(", ");
}

/** Apply headshot + supplemental photos after AI (model often omits imageIndex/captions). */
export function ensureArticleImages(
  article: ArticleJson,
  headshotUrl: string | undefined,
  supplementalPhotos: SupplementalPhoto[],
  subjectName: string,
): ArticleJson {
  let result = { ...article };
  const headshot = headshotUrl?.trim();
  if (headshot) {
    result = {
      ...result,
      infobox: { ...result.infobox, imageUrl: headshot },
    };
  }
  if (supplementalPhotos.length) {
    result = applySupplementalPhotos(result, supplementalPhotos, subjectName);
  }
  return result;
}

async function compressFigureDataUrl(url: string): Promise<string> {
  if (!url.startsWith("data:image/")) return url;
  try {
    return await compressDataUrl(url, UPLOAD_LIMITS.extra);
  } catch {
    return url;
  }
}

/** Shrink inline figure blobs so article JSON + headshot fit DB limits. */
export async function compressArticleFigureImages(
  article: ArticleJson,
): Promise<ArticleJson> {
  const sections = await Promise.all(
    article.sections.map(async (sec) => {
      if (!sec.figures?.length) return sec;
      const figures = await Promise.all(
        sec.figures.map(async (f) => ({
          ...f,
          imageUrl: await compressFigureDataUrl(f.imageUrl),
        })),
      );
      return { ...sec, figures };
    }),
  );
  return { ...article, sections };
}
