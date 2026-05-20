import type { Metadata } from "next";

export type ArticleShareMetadataOptions = {
  /** Absolute HTTPS URL for Open Graph / Twitter image (e.g. /api/og/{slug}). */
  ogImageUrl?: string;
  /** Canonical article page URL shown in previews. */
  pageUrl?: string;
};

/** Link preview title (iMessage, Slack, etc.) — article name only, no site suffix. */
export function articleShareMetadata(
  articleTitle: string,
  subtitle?: string,
  options?: ArticleShareMetadataOptions,
): Metadata {
  const title = articleTitle.trim() || "WikiMe article";
  const description =
    subtitle?.trim() ||
    `A Wikipedia-style article about ${title}, created with WikiMe.`;

  const ogImage = options?.ogImageUrl?.trim();
  const images = ogImage
    ? [{ url: ogImage, width: 440, height: 560, alt: `${title} — WikiMe` }]
    : undefined;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "WikiMe",
      url: options?.pageUrl,
      images,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
