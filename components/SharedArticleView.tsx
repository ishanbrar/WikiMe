"use client";

import { useState } from "react";
import type { AppearanceSettings, SavedArticle } from "@/types/article";
import { ArticleModeSwitchBanner } from "@/components/ExampleModeSwitchBanner";
import { MobileArticleActionBar } from "@/components/MobileArticleActionBar";
import { WikiArticlePage } from "@/components/WikiArticlePage";
import { getAlternateMayaChenExampleSlug } from "@/lib/exampleArticle";
import { withHeadshotOnSaved } from "@/lib/headshotForArticle";
import { hapticError, hapticSuccess } from "@/lib/haptics";

export function SharedArticleView({
  saved,
}: {
  saved: SavedArticle;
}) {
  const display = withHeadshotOnSaved(saved);
  const alternateExampleSlug = getAlternateMayaChenExampleSlug(saved.slug);
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    textSize: "standard",
    width: "standard",
    color: "auto",
  });

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
        onToggleEdit={() => {}}
        onCopyLink={() => {}}
        onShare={() => void shareCurrentLink()}
        showEditAction={false}
        showCopyAction={false}
      />
    </div>
  );
}
