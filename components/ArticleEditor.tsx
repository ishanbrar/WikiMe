"use client";

import { useMemo, useState } from "react";
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
import { MobileArticleActionBar } from "@/components/MobileArticleActionBar";
import { saveArticleLocal } from "@/lib/storage";
import { saveArticleToServer } from "@/lib/saveArticleClient";
import { buildShareUrl } from "@/lib/share";
import { nanoid } from "nanoid";
import {
  applyHeadshotToArticle,
  updateArticleHeadshot,
} from "@/lib/headshotForArticle";
import { applyIntakeSocialToInfobox } from "@/lib/socialLinks";
import { HeadshotUploader } from "@/components/HeadshotUploader";
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
import { ArticleModeSwitchBanner } from "@/components/ExampleModeSwitchBanner";
import { ArticleWikiLinksEditor } from "@/components/ArticleWikiLinksEditor";
import type { ArticleMode } from "@/types/article";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { articleCompletenessWarnings } from "@/lib/articleCompleteness";
import type { LinkExtractionStatus } from "@/lib/linkExtraction";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";

export function ArticleEditor({
  initialArticle,
  intake,
  headshotDataUrl,
  extraPhotoUrls,
  extractedFacts,
  savedId,
  createdAt,
  slug,
  shortLink: initialShortLink = false,
  alternateSlug,
  articleMode,
  linkStatuses = [],
  canEdit = true,
}: {
  initialArticle: ArticleJson;
  intake: IntakeData;
  headshotDataUrl?: string;
  extraPhotoUrls?: string[];
  extractedFacts?: ExtractedProfileFacts;
  savedId?: string;
  createdAt?: string;
  slug?: string;
  shortLink?: boolean;
  alternateSlug?: string;
  articleMode?: ArticleMode;
  linkStatuses?: LinkExtractionStatus[];
  canEdit?: boolean;
}) {
  const [article, setArticle] = useState(() =>
    applyHeadshotToArticle(initialArticle, headshotDataUrl),
  );
  const [headshot, setHeadshot] = useState(
    () => headshotDataUrl?.trim() || initialArticle.infobox.imageUrl?.trim() || "",
  );
  const [intakeState, setIntakeState] = useState(intake);
  const [editing, setEditing] = useState(false);
  const [showHeadshot, setShowHeadshot] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    textSize: "standard",
    width: "standard",
    color: "auto",
  });
  const isAdmin = useIsAdmin();
  const [stableSavedId] = useState(() => savedId ?? nanoid());
  const [stableCreatedAt, setStableCreatedAt] = useState(
    () => createdAt ?? new Date().toISOString(),
  );
  const [generatedSlug, setGeneratedSlug] = useState(() => slug?.trim() || "");
  const [shareSlug, setShareSlug] = useState(() => slug?.trim() || "");
  const [shareShortLink, setShareShortLink] = useState(initialShortLink);
  const [shareUrl, setShareUrl] = useState(() =>
    slug ? buildShareUrl(slug, initialShortLink) : "",
  );
  const [saveMessage, setSaveMessage] = useState("");

  const slugForSave = () => {
    const known = shareSlug.trim() || slug?.trim() || generatedSlug;
    if (known) return known;
    const created = nanoid(10);
    setGeneratedSlug(created);
    return created;
  };

  const buildSessionPayload = (saved: SavedArticle) => ({
    article: saved.articleJson,
    intake: saved.intake,
    headshotDataUrl: saved.headshotDataUrl,
    extraPhotoUrls,
    facts: saved.extractedFacts,
    savedId: saved.id,
    createdAt: saved.createdAt,
    slug: saved.slug,
    shortLink: saved.shortLink,
    alternateSlug: saved.alternateSlug,
    mode: saved.mode,
    linkStatuses,
  });

  const syncCurrentSession = (saved: SavedArticle) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("wikime_current", JSON.stringify(buildSessionPayload(saved)));
    } catch {
      sessionStorage.setItem(
        "wikime_current",
        JSON.stringify({
          ...buildSessionPayload(saved),
          extraPhotoUrls: [],
        }),
      );
    }
  };

  const syncArticleRoute = (nextSlug: string) => {
    if (typeof window === "undefined" || window.location.pathname !== "/article") return;
    const url = new URL(window.location.href);
    url.searchParams.set("slug", nextSlug);
    url.searchParams.delete("id");
    window.history.replaceState(null, "", url.toString());
  };

  /** Save always available on the editor; first save assigns a stable slug if needed. */
  const canSaveToServer = true;

  const supplementalFromUrls = (): ExtraPhotoUpload[] =>
    (extraPhotoUrls ?? []).map((dataUrl) => ({ dataUrl, description: "" }));
  const completenessWarnings = articleCompletenessWarnings({
    article,
    intake: intakeState,
    expectedExtraPhotos: extraPhotoUrls?.length ?? 0,
    linkStatuses,
  });
  const hasSection = (id: string, pattern?: RegExp) =>
    article.sections.some((s) => s.id === id || (pattern && pattern.test(`${s.id} ${s.title}`)));

  const onHeadshotChange = (dataUrl: string) => {
    setHeadshot(dataUrl);
    setArticle((prev) => updateArticleHeadshot(prev, dataUrl));
  };

  const articleWithSocialLinks = useMemo(
    () => ({
      ...article,
      infobox: applyIntakeSocialToInfobox(article.infobox, intakeState),
    }),
    [article, intakeState],
  );

  const articleForSave = (): ArticleJson => articleWithSocialLinks;

  const buildSavedSnapshot = (
    overrides: Partial<SavedArticle> = {},
  ): SavedArticle => ({
    id: stableSavedId,
    slug: overrides.slug ?? slugForSave(),
    articleJson: overrides.articleJson ?? articleForSave(),
    mode: overrides.mode ?? intakeState.mode,
    intake: overrides.intake ?? intakeState,
    headshotDataUrl: overrides.headshotDataUrl ?? (headshot || undefined),
    extraPhotoUrls: overrides.extraPhotoUrls ?? extraPhotoUrls,
    extractedFacts: overrides.extractedFacts ?? extractedFacts,
    shortLink: overrides.shortLink ?? shareShortLink,
    alternateSlug: overrides.alternateSlug ?? alternateSlug,
    userId: overrides.userId,
    creatorEmail: overrides.creatorEmail,
    isPublic: overrides.isPublic,
    createdAt: overrides.createdAt ?? stableCreatedAt,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  });

  const persistLocal = (overrides: Partial<SavedArticle> = {}) => {
    const saved = buildSavedSnapshot(overrides);
    saveArticleLocal(saved);
    syncCurrentSession(saved);
    return saved;
  };

  const saveToServer = async (): Promise<string | null> => {
    setSaveMessage("");
    const local = persistLocal();
    let withHeadshot: SavedArticle;
    try {
      withHeadshot = await prepareArticleForDb({
        ...local,
        articleJson: applyHeadshotToArticle(articleForSave(), headshot),
        headshotDataUrl: headshot || undefined,
        alternateSlug,
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not prepare article for upload";
      setSaveMessage(msg);
      return null;
    }
    const result = await saveArticleToServer(withHeadshot, { isAdmin });
    if (result.ok) {
      setShareSlug(result.slug);
      setShareShortLink(result.shortLink);
      setShareUrl(result.url);
      const persisted = persistLocal({
        slug: result.slug,
        shortLink: result.shortLink,
        createdAt: local.createdAt,
      });
      setStableCreatedAt(persisted.createdAt);
      syncArticleRoute(result.slug);
      setSaveMessage("Saved to your share link.");
      hapticSuccess();
      return result.slug;
    }
    const msg = result.error || "Save failed";
    setSaveMessage(msg);
    hapticError();
    console.error(msg);
    return null;
  };

  const saveHeadshot = async () => {
    if (!canEdit) return;
    if (!canSaveToServer) {
      setSaveMessage("Use Share → Copy share link once to create a saved article first.");
      return;
    }
    setBusy(true);
    setLoadingMessage("Saving headshot…");
    try {
      await saveToServer();
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const saveArticle = async () => {
    if (!canEdit) return;
    setBusy(true);
    setLoadingMessage("Saving article…");
    try {
      await saveToServer();
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const regenerateAll = async () => {
    setBusy(true);
    setLoadingMessage("Regenerating article…");
    try {
      const prepared = await prepareUploadImages({
        headshot: headshot || undefined,
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
            targetSection: p.targetSection?.trim() || undefined,
            caption: p.caption?.trim() || undefined,
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
              targetSection: p.targetSection?.trim() || undefined,
              caption: p.caption?.trim() || undefined,
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
          prepared.headshot ?? headshot,
          prepared.extraPhotos,
          intakeState.fullName || intakeState.articleTitle,
        );
        next = updateArticleHeadshot(next, prepared.headshot ?? headshot);
        if (prepared.headshot ?? headshot) {
          setHeadshot(prepared.headshot ?? headshot);
        }
        console.info(
          "[WikiMe regen] images:",
          formatArticleImageMetrics(
            articleImageMetrics(next, prepared.headshot ?? headshot),
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
          headshotDataUrl: headshot || undefined,
        }),
      });
      const data = await res.json();
      if (data.section) {
        setArticle((prev) => {
          const exists = prev.sections.some((s) => s.id === sectionId);
          return {
            ...prev,
            sections: exists
              ? prev.sections.map((s) => (s.id === sectionId ? data.section : s))
              : [...prev.sections, data.section],
          };
        });
      }
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const placeMissingPhotos = async () => {
    setBusy(true);
    setLoadingMessage("Placing photos…");
    try {
      const next = ensureArticleImages(
        article,
        headshot || undefined,
        supplementalFromUrls(),
        intakeState.fullName || intakeState.articleTitle,
      );
      setArticle(next);
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const displayMode = articleMode ?? intakeState.mode;
  const editingEnabled = canEdit && editing;
  const showHeadshotPanel = canEdit && (showHeadshot || editing);
  const showIntakePanel = canEdit && showIntake;
  const toolbarSaved = useMemo<SavedArticle>(
    () => ({
      id: stableSavedId,
      slug: shareSlug.trim() || slug?.trim() || generatedSlug,
      articleJson: articleWithSocialLinks,
      mode: intakeState.mode,
      intake: intakeState,
      headshotDataUrl: headshot || undefined,
      extraPhotoUrls,
      extractedFacts,
      shortLink: shareShortLink,
      alternateSlug,
      createdAt: stableCreatedAt,
      updatedAt: new Date().toISOString(),
    }),
    [
      alternateSlug,
      articleWithSocialLinks,
      extraPhotoUrls,
      extractedFacts,
      generatedSlug,
      headshot,
      intakeState,
      shareShortLink,
      shareSlug,
      slug,
      stableCreatedAt,
      stableSavedId,
    ],
  );

  const resolveShareUrl = async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    const slugResult = await saveToServer();
    if (!slugResult) return null;
    return buildShareUrl(slugResult, shareShortLink);
  };

  const copyShareLink = async () => {
    const url = await resolveShareUrl();
    if (!url) {
      hapticError();
      return;
    }
    await navigator.clipboard.writeText(url);
    hapticSuccess();
    setSaveMessage("Share link copied.");
  };

  const shareArticle = async () => {
    const url = await resolveShareUrl();
    if (!url) {
      hapticError();
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: `Read ${article.title} on WikiMe.`,
          url,
        });
        hapticSuccess();
        return;
      }
      await navigator.clipboard.writeText(url);
      hapticSuccess();
      setSaveMessage("Share link copied.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      hapticError();
    }
  };

  return (
    <div className="relative">
      {alternateSlug && (
        <ArticleModeSwitchBanner
          currentMode={displayMode}
          subjectName={intakeState.fullName || intakeState.articleTitle}
        />
      )}

      {busy && (
        <LoadingOverlay
          message={loadingMessage}
          subMessage="Please wait — do not close this tab."
        />
      )}

      <ArticleToolbar
        canEdit={canEdit}
        editing={editingEnabled}
        onToggleEdit={() => canEdit && setEditing(!editing)}
        showHeadshot={showHeadshot}
        onToggleHeadshot={() => setShowHeadshot(!showHeadshot)}
        showIntake={showIntake}
        onToggleIntake={() => setShowIntake(!showIntake)}
        busy={busy}
        onRegenerateAll={regenerateAll}
        intakeMode={intakeState.mode}
        onModeChange={(mode) => setIntakeState({ ...intakeState, mode })}
        onSaveLocal={persistLocal}
        article={articleWithSocialLinks}
        saved={toolbarSaved}
        onSaveToServer={saveToServer}
        onSaveArticle={saveArticle}
        canSaveToServer={canSaveToServer}
        saveMessage={saveMessage}
      />

      {showHeadshotPanel && (
        <div
          className={`no-print max-w-2xl mx-auto p-6 bg-slate-50 border-b ${busy ? "ui-busy" : ""}`}
        >
          <HeadshotUploader
            label="Infobox headshot"
            image={headshot}
            subjectName={intakeState.fullName || intakeState.articleTitle}
            onChange={onHeadshotChange}
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <LoadingButton
              className="btn-primary"
              loading={busy}
              loadingLabel="Saving…"
              disabled={busy || !canSaveToServer}
              onClick={() => void saveHeadshot()}
            >
              Save headshot
            </LoadingButton>
            {!canSaveToServer && (
              <span className="text-xs text-amber-700">
                Share once to create a link, then you can save headshot changes.
              </span>
            )}
          </div>
        </div>
      )}

      {editingEnabled && (
        <div
          className={`no-print max-w-3xl mx-auto p-6 bg-white border-b ${busy ? "ui-busy" : ""}`}
        >
          <ArticleWikiLinksEditor
            article={article}
            onArticleChange={setArticle}
            disabled={busy}
          />
        </div>
      )}

      {saveMessage && (
        <p
          className={`no-print max-w-3xl mx-auto px-4 py-2 text-sm ${saveMessage.includes("failed") || saveMessage.includes("Share") ? "text-amber-800 bg-amber-50" : "text-green-800 bg-green-50"}`}
          role="status"
        >
          {saveMessage}
        </p>
      )}

      {showIntakePanel && (
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

      {canEdit && completenessWarnings.length > 0 && (
        <div className="article-completeness no-print" role="status">
          <p className="article-completeness-title">Some details may need attention</p>
          <ul>
            {completenessWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {editingEnabled && (
        <div
          className={`no-print max-w-2xl mx-auto p-4 text-sm ${busy ? "ui-busy" : ""}`}
        >
          <p className="font-medium mb-2">Regenerate section:</p>
          <div className="flex flex-wrap gap-2">
            {intakeState.achievements.trim() && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => regenerateSection(hasSection("achievements") ? "achievements" : "career")}
                disabled={busy}
              >
                Expand publications
              </button>
            )}
            {intakeState.lifeEvents.trim() && !hasSection("personal-life", /personal|life/i) && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => regenerateSection("personal-life")}
                disabled={busy}
              >
                Add personal life
              </button>
            )}
            {intakeState.controversies.trim() && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => regenerateSection("controversies")}
                disabled={busy}
              >
                Rewrite controversies
              </button>
            )}
            {(extraPhotoUrls?.length ?? 0) > 0 && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => void placeMissingPhotos()}
                disabled={busy}
              >
                Place photos
              </button>
            )}
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
          article={articleWithSocialLinks}
          subjectName={intakeState.fullName}
          intake={intakeState}
          editable={editingEnabled && !busy}
          onArticleChange={setArticle}
          appearance={appearance}
          onAppearanceChange={setAppearance}
        />
      </div>

      <MobileArticleActionBar
        editing={editingEnabled}
        busy={busy}
        onToggleEdit={() => {
          if (!canEdit) return;
          hapticTap();
          setEditing(!editing);
        }}
        onCopyLink={() => void copyShareLink()}
        onShare={() => void shareArticle()}
        showEditAction={canEdit}
        showCopyAction={canEdit}
      />
    </div>
  );
}
