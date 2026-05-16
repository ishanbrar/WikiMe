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
import { ExportControls } from "@/components/ExportControls";
import { IntakeForm } from "@/components/IntakeForm";
import { LoadingButton } from "@/components/LoadingButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { saveArticleLocal } from "@/lib/storage";
import { saveArticleToServer } from "@/lib/saveArticleClient";
import { buildShareUrl } from "@/lib/share";
import { nanoid } from "nanoid";
import { applyHeadshotToArticle } from "@/lib/headshotForArticle";
import { prepareArticleForDb } from "@/lib/prepareArticleForDb";

export function ArticleEditor({
  initialArticle,
  intake,
  headshotDataUrl,
  extractedFacts,
  savedId,
  slug,
}: {
  initialArticle: ArticleJson;
  intake: IntakeData;
  headshotDataUrl?: string;
  extractedFacts?: ExtractedProfileFacts;
  savedId?: string;
  slug?: string;
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
  const [shareUrl, setShareUrl] = useState(() =>
    slug ? buildShareUrl(slug) : "",
  );

  const saved: SavedArticle = {
    id: savedId ?? nanoid(),
    slug: shareSlug || slug || nanoid(10),
    articleJson: article,
    mode: intakeState.mode,
    intake: intakeState,
    headshotDataUrl,
    extractedFacts,
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
    const withHeadshot = prepareArticleForDb({
      ...local,
      articleJson: applyHeadshotToArticle(article, headshotDataUrl),
      headshotDataUrl,
    });
    const result = await saveArticleToServer(withHeadshot);
    if (result.ok) {
      setShareSlug(result.slug);
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
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: intakeState,
          facts: extractedFacts,
        }),
      });
      const data = await res.json();
      if (data.article) {
        const next = data.article as ArticleJson;
        if (headshotDataUrl) next.infobox.imageUrl = headshotDataUrl;
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
          facts: extractedFacts,
          article,
          sectionId,
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

      <div
        className={`article-toolbar no-print sticky top-0 z-50 bg-white/95 border-b border-slate-200 px-4 py-2 flex flex-wrap gap-2 items-center ${busy ? "opacity-60" : ""}`}
      >
        <a
          href="/"
          className={`text-sm text-blue-600 ${busy ? "pointer-events-none" : ""}`}
          aria-disabled={busy}
        >
          WikiMe
        </a>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => setEditing(!editing)}
          disabled={busy}
        >
          {editing ? "Preview" : "Edit"}
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => setShowIntake(!showIntake)}
          disabled={busy}
        >
          Intake
        </button>
        <LoadingButton
          className="btn-secondary text-sm"
          loading={busy}
          loadingLabel="Regenerating…"
          onClick={regenerateAll}
          disabled={busy}
        >
          Regenerate all
        </LoadingButton>
        <select
          className="text-sm border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          value={intakeState.mode}
          disabled={busy}
          onChange={(e) =>
            setIntakeState({
              ...intakeState,
              mode: e.target.value as IntakeData["mode"],
            })
          }
        >
          <option value="realism">Realism</option>
          <option value="creative">Creative</option>
        </select>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={persistLocal}
          disabled={busy}
        >
          Save locally
        </button>
      </div>

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

      <ExportControls
        article={article}
        saved={saved}
        printTargetId="wiki-article-print"
        onSave={saveToServer}
        disabled={busy}
      />

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
