import Link from "next/link";
import { getArticleBySlugServer } from "@/lib/articleStore";
import { getExampleArticleBySlug } from "@/lib/exampleArticle";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  savedArticleJsonLd,
  savedArticleMetadata,
  serializeJsonLd,
} from "@/lib/articleSeo";
import { ArticleEditor } from "@/components/ArticleEditor";
import { canEditArticle } from "@/lib/articleAccess";
import { getAuthUser } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function sharedArticleMetadata(
  slug: string,
): Promise<Metadata> {
  const saved =
    (await getArticleBySlugServer(slug)) ??
    getExampleArticleBySlug(slug) ??
    null;
  if (!saved) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getAppBaseUrl();
  return savedArticleMetadata(saved, slug, baseUrl);
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

  const baseUrl = getAppBaseUrl();
  const jsonLd = savedArticleJsonLd(saved, slug, baseUrl);
  const user = await getAuthUser();
  const editable = canEditArticle(user, saved);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ArticleEditor
        initialArticle={saved.articleJson}
        intake={saved.intake}
        headshotDataUrl={saved.headshotDataUrl}
        extractedFacts={saved.extractedFacts}
        savedId={saved.id}
        createdAt={saved.createdAt}
        slug={saved.slug}
        shortLink={saved.shortLink ?? false}
        alternateSlug={saved.alternateSlug}
        articleMode={saved.mode}
        canEdit={editable}
      />
    </>
  );
}
