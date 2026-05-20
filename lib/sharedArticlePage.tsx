import Link from "next/link";
import { getArticleBySlugServer } from "@/lib/articleStore";
import { getExampleArticleBySlug } from "@/lib/exampleArticle";
import { articleShareMetadata } from "@/lib/articleShareMetadata";
import {
  articleHasSharePreviewImage,
  buildArticleOgImageUrl,
  buildArticlePageUrl,
  resolveArticleHeadshotUrl,
} from "@/lib/headshotOgImage";
import { getAppBaseUrl } from "@/lib/appUrl";
import { SharedArticleView } from "@/components/SharedArticleView";
import type { Metadata } from "next";

export async function sharedArticleMetadata(
  slug: string,
): Promise<Metadata> {
  const saved =
    (await getArticleBySlugServer(slug)) ??
    getExampleArticleBySlug(slug) ??
    null;
  if (!saved) {
    return { title: "Article not found" };
  }

  const baseUrl = getAppBaseUrl();
  const headshot = resolveArticleHeadshotUrl(saved);
  const ogImageUrl = articleHasSharePreviewImage(headshot)
    ? buildArticleOgImageUrl(slug, baseUrl)
    : undefined;

  return articleShareMetadata(
    saved.articleJson.title || saved.intake.articleTitle,
    saved.articleJson.subtitle,
    {
      ogImageUrl,
      pageUrl: buildArticlePageUrl(slug, saved.shortLink ?? false, baseUrl),
    },
  );
}

export async function SharedArticlePageBody({
  slug,
  requireShortLink = false,
}: {
  slug: string;
  requireShortLink?: boolean;
}) {
  const saved = await getArticleBySlugServer(slug);

  if (!saved || (requireShortLink && !saved.shortLink)) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-xl font-semibold">Article not found</h1>
        <p className="mt-2 text-slate-600">
          This share link may have expired or the server was restarted (file-based storage).
        </p>
        <Link href="/" className="text-blue-600 mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  return <SharedArticleView saved={saved} readOnly />;
}
