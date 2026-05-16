"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeArticleFromUrl } from "@/lib/share";
import { SharedArticleView } from "@/components/SharedArticleView";
import type { SavedArticle } from "@/types/article";
import { createDefaultIntake } from "@/components/IntakeForm";
import { nanoid } from "nanoid";

export function EncodedShareClient({ encoded }: { encoded: string | null }) {
  const [saved, setSaved] = useState<SavedArticle | null>(null);

  useEffect(() => {
    if (!encoded) return;
    const decoded = decodeArticleFromUrl(encoded);
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
  }, [encoded]);

  if (!encoded) {
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
