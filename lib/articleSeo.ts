import type { Metadata } from "next";
import type { ArticleJson, SavedArticle } from "@/types/article";
import { articleShareMetadata } from "@/lib/articleShareMetadata";
import {
  articleHasSharePreviewImage,
  buildArticleOgImageUrl,
  buildArticlePageUrl,
  resolveArticleHeadshotUrl,
} from "@/lib/headshotOgImage";

function compactText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncateSentence(text: string, max = 160): string {
  const compact = compactText(text);
  if (compact.length <= max) return compact;
  const sliced = compact.slice(0, max - 1);
  const lastBoundary = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf(","),
    sliced.lastIndexOf(" "),
  );
  return `${sliced.slice(0, lastBoundary > 80 ? lastBoundary : max - 1).trim()}…`;
}

export function articleSeoDescription(article: ArticleJson): string {
  return (
    truncateSentence(article.summaryLead.join(" "), 170) ||
    article.subtitle ||
    `A Wikipedia-style article about ${article.title}.`
  );
}

function articleKeywords(saved: SavedArticle): string[] {
  const article = saved.articleJson;
  return [
    article.title,
    article.infobox.name,
    article.infobox.occupation,
    article.infobox.currentLocation,
    ...article.infobox.knownFor,
    ...article.properNouns.slice(0, 12),
  ]
    .map((s) => compactText(s))
    .filter((s, i, arr) => s.length > 1 && arr.indexOf(s) === i);
}

export function savedArticleMetadata(
  saved: SavedArticle,
  slug: string,
  baseUrl: string,
): Metadata {
  const article = saved.articleJson;
  const title = article.title || saved.intake.articleTitle || saved.intake.fullName;
  const description = articleSeoDescription(article);
  const canonical = buildArticlePageUrl(slug, saved.shortLink ?? false, baseUrl);
  const headshot = resolveArticleHeadshotUrl(saved);
  const ogImageUrl = articleHasSharePreviewImage(headshot)
    ? buildArticleOgImageUrl(slug, baseUrl)
    : undefined;
  const metadata = articleShareMetadata(title, description, {
    ogImageUrl,
    pageUrl: canonical,
  });

  return {
    ...metadata,
    description,
    alternates: {
      canonical,
    },
    keywords: articleKeywords(saved),
    robots: {
      index: saved.isPublic !== false,
      follow: true,
      googleBot: {
        index: saved.isPublic !== false,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      ...metadata.openGraph,
      description,
      url: canonical,
      type: "article",
      publishedTime: saved.createdAt,
      modifiedTime: saved.updatedAt,
      authors: [article.infobox.name || title],
    },
    twitter: {
      ...metadata.twitter,
      description,
    },
  };
}

function socialUrls(saved: SavedArticle): string[] {
  return [
    ...saved.articleJson.infobox.socialLinks.map((l) => l.url),
    saved.intake.linkedinUrl,
    saved.intake.instagramUrl,
    saved.intake.xUrl,
  ].filter((url, i, arr) => Boolean(url) && arr.indexOf(url) === i);
}

export function savedArticleJsonLd(
  saved: SavedArticle,
  slug: string,
  baseUrl: string,
): Record<string, unknown> {
  const article = saved.articleJson;
  const canonical = buildArticlePageUrl(slug, saved.shortLink ?? false, baseUrl);
  const title = article.title || saved.intake.articleTitle || saved.intake.fullName;
  const description = articleSeoDescription(article);
  const image = articleHasSharePreviewImage(resolveArticleHeadshotUrl(saved))
    ? buildArticleOgImageUrl(slug, baseUrl)
    : undefined;
  const personId = `${canonical}#person`;
  const articleId = `${canonical}#article`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: title,
        description,
        isPartOf: {
          "@type": "WebSite",
          name: "WikiMe",
          url: baseUrl,
        },
        mainEntity: { "@id": articleId },
      },
      {
        "@type": "Article",
        "@id": articleId,
        headline: title,
        description,
        image,
        datePublished: saved.createdAt,
        dateModified: saved.updatedAt,
        author: {
          "@type": "Organization",
          name: "WikiMe",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "WikiMe",
          url: baseUrl,
        },
        about: { "@id": personId },
        mainEntityOfPage: { "@id": canonical },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: article.infobox.name || title,
        description,
        image,
        birthDate: article.infobox.born || undefined,
        homeLocation: article.infobox.hometown || undefined,
        jobTitle: article.infobox.occupation || undefined,
        alumniOf: article.infobox.education || undefined,
        sameAs: socialUrls(saved),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "WikiMe",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: canonical,
          },
        ],
      },
    ],
  };
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
