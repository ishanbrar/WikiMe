"use client";

import { useState } from "react";
import type {
  ArticleJson,
  AppearanceSettings,
  ExtractedProfileFacts,
  IntakeData,
  SavedArticle,
} from "@/types/article";
import { WikiArticlePage } from "@/components/WikiArticlePage";
import { ArticleToolbar } from "@/components/ArticleToolbar";
import { IntakeForm } from "@/components/IntakeForm";
import { LoadingButton } from "@/components/LoadingButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { saveArticleLocal } from "@/lib/storage";
import { saveArticleToServer } from "@/lib/saveArticleClient";
import { buildShareUrl } from "@/lib/share";
import { nanoid } from "nanoid";
import { applyHeadshotToArticle } from "@/lib/headshotForArticle";
import {
  articleImageMetrics,
  ensureArticleImages,
  formatArticleImageMetrics,
} from "@/lib/articleImages";
import { enrichFactsWithIntake } from "@/lib/enrichFactsWithIntake";
import { prepareArticleForDb } from "@/lib/prepareArticleForDb";
import { prepareUploadImages } from "@/lib/prepareUploadImages";
import type { ExtraPhotoUpload } from "@/lib/extraPhotoUpload";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";

export function ArticleEditor({
  initialArticle,
  intake,
  headshotDataUrl,
  extraPhotoUrls,
  extractedFacts,
  savedId,
  slug,
  shortLink: initialShortLink = false,
}: {
  initialArticle: ArticleJson;
  intake: IntakeData;
  headshotDataUrl?: string;
  extraPhotoUrls?: string[];
  extractedFacts?: ExtractedProfileFacts;
  savedId?: string;
  slug?: string;
  shortLink?: boolean;
}) {
  const [article, setArticle] = useState(() =>
    applyHeadshotToArticle(initialArticle, headshotDataUrl),
  );
  const [intakeState, setIntakeState] = useState(intake);
  const [editing, setEditing] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    textSize: "standard",
    width: "standard",
    color: "auto",
  });
  const [shareSlug, setShareSlug] = useState(slug ?? "");
  const [shareShortLink, setShareShortLink] = useState(initialShortLink);
  const [shareUrl, setShareUrl] = useState(() =>
    slug ? buildShareUrl(slug, initialShortLink) : "",
  );

  const supplementalFromUrls = (): ExtraPhotoUpload[] =>
    (extraPhotoUrls ?? []).map((dataUrl) => ({ dataUrl, description: "" }));

  const saved: SavedArticle = {
    id: savedId ?? nanoid(),
    slug: shareSlug || slug || nanoid(10),
    articleJson: article,
    mode: intakeState.mode,
    intake: intakeState,
    headshotDataUrl,
    extractedFacts,
    shortLink: shareShortLink,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const persistLocal = () => {
    const s = {
      ...saved,
      articleJson: article,
      intake: intakeState,
      updatedAt: new Date().toISOString(),
    };
    saveArticleLocal(s);
    return s;
  };

  const saveToServer = async (): Promise<string | null> => {
    const local = persistLocal();
    const withHeadshot = await prepareArticleForDb({
      ...local,
      articleJson: applyHeadshotToArticle(article, headshotDataUrl),
      headshotDataUrl,
    });
    const result = await saveArticleToServer(withHeadshot);
    if (result.ok) {
      setShareSlug(result.slug);
      setShareShortLink(result.shortLink);
      setShareUrl(result.url);
      return result.slug;
    }
    console.error(result.error);
    return null;
  };

  const regenerateAll = async () => {
    setBusy(true);
    setLoadingMessage("Regenerating article…");
    try {
      const prepared = await prepareUploadImages({
        headshot: headshotDataUrl,
        extraPhotos: supplementalFromUrls(),
      });

      const facts = enrichFactsWithIntake(
        extractedFacts ?? emptyExtractedFacts(),
        intakeState,
      );

      let res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: intakeState,
          facts,
          headshotDataUrl: prepared.headshot,
          extraPhotos: prepared.extraPhotos.map((p) => ({
            dataUrl: p.dataUrl,
            description: p.description.trim() || undefined,
          })),
        }),
      });

      if (res.status === 413) {
        const preparedAgg = await prepareUploadImages(
          {
            headshot: prepared.headshot,
            extraPhotos: prepared.extraPhotos,
          },
          true,
        );
        res = await fetch("/api/generate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intake: intakeState,
            facts,
            headshotDataUrl: preparedAgg.headshot,
            extraPhotos: preparedAgg.extraPhotos.map((p) => ({
              dataUrl: p.dataUrl,
              description: p.description.trim() || undefined,
            })),
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        console.error(data.error ?? "Regeneration failed");
        return;
      }
      if (data.article) {
        let next = ensureArticleImages(
          data.article as ArticleJson,
          prepared.headshot ?? headshotDataUrl,
          prepared.extraPhotos,
          intakeState.fullName || intakeState.articleTitle,
        );
        console.info(
          "[WikiMe regen] images:",
          formatArticleImageMetrics(
            articleImageMetrics(next, prepared.headshot ?? headshotDataUrl),
          ),
        );
        setArticle(next);
      }
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const regenerateSection = async (sectionId: string) => {
    setBusy(true);
    setLoadingMessage(`Regenerating “${article.sections.find((s) => s.id === sectionId)?.title ?? sectionId}”…`);
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: intakeState,
          facts: enrichFactsWithIntake(
            extractedFacts ?? emptyExtractedFacts(),
            intakeState,
          ),
          article,
          sectionId,
          headshotDataUrl,
        }),
      });
      const data = await res.json();
      if (data.section) {
        setArticle({
          ...article,
          sections: article.sections.map((s) =>
            s.id === sectionId ? data.section : s,
          ),
        });
      }
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="relative">
      {busy && (
        <LoadingOverlay
          message={loadingMessage}
          subMessage="Please wait — do not close this tab."
        />
      )}

      <ArticleToolbar
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        showIntake={showIntake}
        onToggleIntake={() => setShowIntake(!showIntake)}
        busy={busy}
        onRegenerateAll={regenerateAll}
        intakeMode={intakeState.mode}
        onModeChange={(mode) => setIntakeState({ ...intakeState, mode })}
        onSaveLocal={persistLocal}
        article={article}
        saved={saved}
        onSaveToServer={saveToServer}
      />

      {showIntake && (
        <div
          className={`max-w-2xl mx-auto p-6 bg-slate-50 border-b no-print ${busy ? "ui-busy" : ""}`}
        >
          <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
            <IntakeForm value={intakeState} onChange={setIntakeState} />
          </fieldset>
          <LoadingButton
            className="btn-primary mt-4"
            loading={busy}
            loadingLabel="Regenerating…"
            onClick={regenerateAll}
            disabled={busy}
          >
            Apply & regenerate
          </LoadingButton>
        </div>
      )}

      {shareUrl && (
        <div className="article-permalink no-print">
          <span className="article-permalink-label">Permanent link</span>
          <a href={shareUrl} className="article-permalink-url">
            {shareUrl}
          </a>
        </div>
      )}

      {editing && (
        <div
          className={`no-print max-w-2xl mx-auto p-4 text-sm ${busy ? "ui-busy" : ""}`}
        >
          <p className="font-medium mb-2">Regenerate section:</p>
          <div className="flex flex-wrap gap-2">
            {article.sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="btn-secondary text-xs"
                onClick={() => regenerateSection(s.id)}
                disabled={busy}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={busy ? "ui-busy" : ""}>
        <WikiArticlePage
          article={article}
          subjectName={intakeState.fullName}
          intake={intakeState}
          editable={editing && !busy}
          onArticleChange={setArticle}
          appearance={appearance}
          onAppearanceChange={setAppearance}
        />
      </div>
    </div>
  );
}
