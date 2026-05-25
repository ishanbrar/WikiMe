import type { MetadataRoute } from "next";
import { CANONICAL_APP_URL } from "@/lib/appUrl";
import { buildArticleOgImageUrl } from "@/lib/headshotOgImage";
import { listPublicArticleSitemapEntriesServer } from "@/lib/articleStore";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: CANONICAL_APP_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${CANONICAL_APP_URL}/generate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const articleRoutes = (await listPublicArticleSitemapEntriesServer()).map(
    (article) => ({
      url: article.url,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "weekly" as const,
      priority: article.shortLink ? 0.95 : 0.85,
      images: article.hasImage ? [buildArticleOgImageUrl(article.slug)] : undefined,
    }),
  );

  return [...staticRoutes, ...articleRoutes];
}
