import type { SavedArticle } from "@/types/article";
import { getAppBaseUrl } from "@/lib/appUrl";
import { articlePath } from "@/lib/articlePaths";

export function resolveArticleHeadshotUrl(saved: SavedArticle): string {
  return (
    saved.headshotDataUrl?.trim() ||
    saved.articleJson.infobox.imageUrl?.trim() ||
    ""
  );
}

export function articleHasSharePreviewImage(headshotUrl: string): boolean {
  if (!headshotUrl) return false;
  return (
    headshotUrl.startsWith("data:image/") ||
    headshotUrl.startsWith("http://") ||
    headshotUrl.startsWith("https://") ||
    headshotUrl.startsWith("/")
  );
}

/** Absolute URL crawlers fetch for Open Graph / Twitter preview images. */
export function buildArticleOgImageUrl(slug: string, baseUrl?: string): string {
  const base = (baseUrl ?? getAppBaseUrl()).replace(/\/$/, "");
  return `${base}/api/og/${encodeURIComponent(slug)}`;
}

const MAX_ENCODED_OG_QUERY = 6000;

/** Preview image URL for /a/share?d=… links (skipped if payload is too long for crawlers). */
export function buildEncodedShareOgImageUrl(
  encoded: string,
  baseUrl?: string,
): string | undefined {
  if (!encoded || encoded.length > MAX_ENCODED_OG_QUERY) return undefined;
  const base = (baseUrl ?? getAppBaseUrl()).replace(/\/$/, "");
  return `${base}/api/og/share?d=${encodeURIComponent(encoded)}`;
}

export function buildArticlePageUrl(
  slug: string,
  shortLink: boolean,
  baseUrl?: string,
): string {
  const base = (baseUrl ?? getAppBaseUrl()).replace(/\/$/, "");
  return `${base}${articlePath(slug, shortLink)}`;
}

/** Turn infobox headshot (often a data URL) into an HTTP response for link previews. */
export function headshotImageResponse(
  imageUrl: string,
  baseUrl: string,
): Response | null {
  const url = imageUrl.trim();
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return Response.redirect(url, 302);
  }

  if (url.startsWith("/")) {
    return Response.redirect(new URL(url, baseUrl).href, 302);
  }

  const match = url.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
  if (!match) return null;

  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) return null;

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
