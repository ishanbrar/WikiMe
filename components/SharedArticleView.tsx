"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppearanceSettings, SavedArticle } from "@/types/article";
import { ArticleModeSwitchBanner } from "@/components/ExampleModeSwitchBanner";
import { MobileArticleActionBar } from "@/components/MobileArticleActionBar";
import { WikiArticlePage } from "@/components/WikiArticlePage";
import {
  getAlternateMayaChenExampleSlug,
  isMayaChenExampleSlug,
} from "@/lib/exampleArticle";
import { withHeadshotOnSaved } from "@/lib/headshotForArticle";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";

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

  const duplicateAndEdit = () => {
    hapticTap();
    sessionStorage.setItem(
      "wikime_current",
      JSON.stringify({
        article: display.articleJson,
        intake: saved.intake,
        headshotDataUrl: display.headshotDataUrl,
        facts: saved.extractedFacts,
        savedId: saved.id,
        slug: saved.slug,
        shortLink: saved.shortLink,
        alternateSlug: saved.alternateSlug,
        mode: saved.mode,
      }),
    );
    window.location.href = "/article";
  };

  const copyCurrentLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    hapticSuccess();
  };

  const shareCurrentLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: display.articleJson.title,
          text: `Read ${display.articleJson.title} on WikiMe.`,
          url,
        });
        hapticSuccess();
        return;
      }
      await navigator.clipboard.writeText(url);
      hapticSuccess();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      hapticError();
    }
  };

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
            onClick={duplicateAndEdit}
          >
            Duplicate & edit locally
          </button>
        )}
      </div>

      {(alternateExampleSlug || saved.alternateSlug) && (
        <ArticleModeSwitchBanner
          currentMode={saved.mode}
          subjectName={saved.intake.fullName || saved.articleJson.title}
          isExample={Boolean(alternateExampleSlug)}
        />
      )}

      <WikiArticlePage
        article={display.articleJson}
        subjectName={saved.intake.fullName}
        intake={saved.intake}
        appearance={appearance}
        onAppearanceChange={setAppearance}
      />

      <MobileArticleActionBar
        editing={false}
        busy={false}
        onToggleEdit={duplicateAndEdit}
        onCopyLink={() => void copyCurrentLink()}
        onShare={() => void shareCurrentLink()}
      />
    </div>
  );
}
