"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArticleEditor } from "@/components/ArticleEditor";
import type { ArticleJson, ExtractedProfileFacts, IntakeData, SavedArticle } from "@/types/article";
import { getArticleById } from "@/lib/storage";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";

function ArticleView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const [loading, setLoading] = useState(Boolean(slug));
  const [payload, setPayload] = useState<{
    article: ArticleJson;
    intake: IntakeData;
    headshotDataUrl?: string;
    facts?: ExtractedProfileFacts;
    savedId?: string;
    slug?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (slug) {
        setLoading(true);
        try {
          const res = await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`);
          if (res.ok) {
            const data = (await res.json()) as { article: SavedArticle };
            if (!cancelled) {
              setPayload({
                article: data.article.articleJson,
                intake: data.article.intake,
                headshotDataUrl: data.article.headshotDataUrl,
                facts: data.article.extractedFacts ?? emptyExtractedFacts(),
                savedId: data.article.id,
                slug: data.article.slug,
              });
            }
            return;
          }
        } catch {
          /* fall through */
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      if (id) {
        const saved = getArticleById(id);
        if (saved) {
          setPayload({
            article: saved.articleJson,
            intake: saved.intake,
            headshotDataUrl: saved.headshotDataUrl,
            facts: saved.extractedFacts,
            savedId: saved.id,
            slug: saved.slug,
          });
          setLoading(false);
          return;
        }
      }

      try {
        const raw = sessionStorage.getItem("wikime_current");
        if (raw) {
          const data = JSON.parse(raw) as {
            article: ArticleJson;
            intake: IntakeData;
            headshotDataUrl?: string;
            facts?: ExtractedProfileFacts;
            savedId?: string;
            slug?: string;
          };
          if (!cancelled) {
            setPayload({
              ...data,
              facts: data.facts ?? emptyExtractedFacts(),
            });
          }
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, slug]);

  if (loading) {
    return <div className="p-8 text-center">Loading article…</div>;
  }

  if (!payload) {
    return (
      <div className="p-12 text-center">
        <p>No article loaded.</p>
        <Link href="/generate" className="text-blue-600 mt-4 inline-block">
          Create one
        </Link>
      </div>
    );
  }

  return (
    <ArticleEditor
      initialArticle={payload.article}
      intake={payload.intake}
      headshotDataUrl={payload.headshotDataUrl}
      extractedFacts={payload.facts}
      savedId={payload.savedId}
      slug={payload.slug}
    />
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading article…</div>}>
      <ArticleView />
    </Suspense>
  );
}
