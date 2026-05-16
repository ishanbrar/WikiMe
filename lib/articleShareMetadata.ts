import type { Metadata } from "next";

/** Link preview title (iMessage, Slack, etc.) — article name only, no site suffix. */
export function articleShareMetadata(
  articleTitle: string,
  subtitle?: string,
): Metadata {
  const title = articleTitle.trim() || "WikiMe article";
  const description =
    subtitle?.trim() ||
    `A Wikipedia-style article about ${title}, created with WikiMe.`;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "WikiMe",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
