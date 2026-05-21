"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppearanceSettings, SavedArticle } from "@/types/article";
import { ExampleModeSwitchBanner } from "@/components/ExampleModeSwitchBanner";
import { WikiArticlePage } from "@/components/WikiArticlePage";
import {
  getAlternateMayaChenExampleSlug,
  isMayaChenExampleSlug,
} from "@/lib/exampleArticle";
import { withHeadshotOnSaved } from "@/lib/headshotForArticle";

export function SharedArticleView({
  saved,
  readOnly,
}: {
  saved: SavedArticle;
  readOnly?: boolean;
}) {
  const display = withHeadshotOnSaved(saved);
  const alternateExampleSlug = getAlternateMayaChenExampleSlug(saved.slug);
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    textSize: "standard",
    width: "standard",
    color: "auto",
  });

  return (
    <div>
      <div className="no-print bg-slate-100 border-b px-4 py-2 flex flex-wrap gap-3 items-center text-sm">
        <Link href="/" className="text-blue-600">
          WikiMe
        </Link>
        <span className="text-slate-600">
          {isMayaChenExampleSlug(saved.slug) ? "Example article" : "Shared article"} ·{" "}
          {saved.mode === "creative" ? "Creative" : "Realism"} mode
        </span>
        {readOnly && (
          <button
            type="button"
            className="ml-auto text-blue-600 bg-transparent border-0 cursor-pointer"
            onClick={() => {
              sessionStorage.setItem(
                "wikime_current",
                JSON.stringify({
                  article: display.articleJson,
                  intake: saved.intake,
                  headshotDataUrl: display.headshotDataUrl,
                  facts: saved.extractedFacts,
                }),
              );
              window.location.href = "/article";
            }}
          >
            Duplicate & edit locally
          </button>
        )}
      </div>

      {alternateExampleSlug && (
        <ExampleModeSwitchBanner
          currentMode={saved.mode}
          alternateSlug={alternateExampleSlug}
        />
      )}

      <WikiArticlePage
        article={display.articleJson}
        subjectName={saved.intake.fullName}
        intake={saved.intake}
        appearance={appearance}
        onAppearanceChange={setAppearance}
      />
    </div>
  );
}
