"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { decodeArticleFromUrl } from "@/lib/share";
import { SharedArticleView } from "@/components/SharedArticleView";
import type { SavedArticle } from "@/types/article";
import { createDefaultIntake } from "@/components/IntakeForm";
import { nanoid } from "nanoid";

function EncodedShare() {
  const searchParams = useSearchParams();
  const d = searchParams.get("d");
  const [saved, setSaved] = useState<SavedArticle | null>(null);

  useEffect(() => {
    if (!d) return;
    const decoded = decodeArticleFromUrl(d);
    if (!decoded) return;
    setSaved({
      id: nanoid(),
      slug: "encoded",
      articleJson: decoded.articleJson,
      mode: decoded.mode,
      intake: createDefaultIntake(decoded.mode),
      headshotDataUrl: decoded.headshotDataUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [d]);

  if (!d) {
    return (
      <div className="p-12 text-center">
        <p>Missing share data.</p>
        <Link href="/" className="text-blue-600">
          Home
        </Link>
      </div>
    );
  }

  if (!saved) {
    return <div className="p-12 text-center">Loading…</div>;
  }

  return <SharedArticleView saved={saved} readOnly />;
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <EncodedShare />
    </Suspense>
  );
}
