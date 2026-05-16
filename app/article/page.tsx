"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArticleEditor } from "@/components/ArticleEditor";
import type { ArticleJson, ExtractedProfileFacts, IntakeData } from "@/types/article";
import { getArticleById } from "@/lib/storage";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";

function ArticleView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [payload, setPayload] = useState<{
    article: ArticleJson;
    intake: IntakeData;
    headshotDataUrl?: string;
    facts?: ExtractedProfileFacts;
    savedId?: string;
    slug?: string;
  } | null>(null);

  useEffect(() => {
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
        };
        setPayload({
          ...data,
          facts: data.facts ?? emptyExtractedFacts(),
        });
      }
    } catch {
      /* ignore */
    }
  }, [id]);

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
