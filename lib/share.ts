import { getClientAppBaseUrl } from "@/lib/appUrl";
import type { SavedArticle } from "@/types/article";

const MAX_ENCODED_LENGTH = 12000;

export function encodeArticleForUrl(article: SavedArticle): string | null {
  try {
    const payload = {
      articleJson: article.articleJson,
      mode: article.mode,
      headshotDataUrl: article.headshotDataUrl?.slice(0, 50000),
    };
    const json = JSON.stringify(payload);
    if (json.length > MAX_ENCODED_LENGTH) return null;
    const b64 =
      typeof window !== "undefined"
        ? btoa(unescape(encodeURIComponent(json)))
        : Buffer.from(json, "utf-8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return null;
  }
}

export function decodeArticleFromUrl(encoded: string): {
  articleJson: SavedArticle["articleJson"];
  mode: SavedArticle["mode"];
  headshotDataUrl?: string;
} | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(escape(atob(b64)))
        : Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(json) as {
      articleJson: SavedArticle["articleJson"];
      mode: SavedArticle["mode"];
      headshotDataUrl?: string;
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(slug: string, origin?: string): string {
  const base = origin ?? getClientAppBaseUrl();
  return `${base}/a/${slug}`;
}

export function buildEncodedShareUrl(encoded: string, origin?: string): string {
  const base = origin ?? getClientAppBaseUrl();
  return `${base}/a/share?d=${encoded}`;
}
