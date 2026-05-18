import { getClientAppBaseUrl } from "@/lib/appUrl";

/** Public path for an article (no origin). */
export function articlePath(slug: string, shortLink = false): string {
  return shortLink ? `/${slug}` : `/a/${slug}`;
}

export function buildArticleUrl(
  slug: string,
  shortLink = false,
  origin?: string,
): string {
  const base = origin ?? getClientAppBaseUrl();
  return `${base}${articlePath(slug, shortLink)}`;
}
