"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createDefaultIntake } from "@/components/IntakeForm";
import { mergeLegacyIntakeFields } from "@/lib/mergeLegacyIntake";
import { IntakeFlow } from "@/components/intake/IntakeFlow";
import { useIsMobile } from "@/hooks/useIsMobile";
import { HeadshotUploader } from "@/components/HeadshotUploader";
import { ScreenshotUploader } from "@/components/ScreenshotUploader";
import { ExtraPhotosUploader } from "@/components/ExtraPhotosUploader";
import { prepareArticleForDb } from "@/lib/prepareArticleForDb";
import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import {
  cacheExtractedFacts,
  getCachedExtractedFacts,
  hashDataUrl,
  saveDraft,
  loadDraft,
  getSavedArticles,
} from "@/lib/storage";
import {
  emptyExtractedFacts,
  mergeExtractedFacts,
  normalizeExtractedFacts,
} from "@/lib/extractProfileFacts";
import { parseJsonResponse } from "@/lib/apiClient";
import { prepareUploadImages } from "@/lib/prepareUploadImages";
import { saveArticleToServer } from "@/lib/saveArticleClient";
import { mapWithConcurrency } from "@/lib/parallelMap";
import { nanoid } from "nanoid";
import { LoadingButton } from "@/components/LoadingButton";
import {
  GenerationProgress,
  type GenerationPhase,
} from "@/components/GenerationProgress";

const EXTRACT_CONCURRENCY = 3;

function GenerateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "creative" ? "creative" : "realism";

  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState<IntakeData>(() =>
    createDefaultIntake(initialMode),
  );
  const [headshot, setHeadshot] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [facts, setFacts] = useState<ExtractedProfileFacts>(emptyExtractedFacts());
  const [busy, setBusy] = useState(false);
  const [genPhase, setGenPhase] = useState<GenerationPhase | null>(null);
  const [genDetail, setGenDetail] = useState("");
  const [genStartedAt, setGenStartedAt] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const draft = loadDraft<{
      intake: IntakeData;
      headshot: string[];
      screenshots: string[];
      facts: ExtractedProfileFacts;
    }>();
    if (draft?.intake) {
      setIntake({
        ...createDefaultIntake(initialMode),
        ...mergeLegacyIntakeFields(
          draft.intake as unknown as Record<string, unknown>,
        ),
      } as IntakeData);
      setFacts(normalizeExtractedFacts(draft.facts ?? emptyExtractedFacts()));
    }
  }, []);

  const persistDraft = useCallback(() => {
    saveDraft({ intake, facts, hasImages: headshot.length > 0 || screenshots.length > 0 });
  }, [intake, headshot, screenshots, facts]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const cancelGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setGenPhase(null);
    setGenDetail("");
    setError("Generation cancelled. Your uploads and intake answers are still here.");
  };

  const extractOne = async (
    shot: string,
    signal?: AbortSignal,
  ): Promise<ExtractedProfileFacts> => {
    const res = await fetch("/api/extract-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screenshots: [shot] }),
      signal,
    });
    const data = await parseJsonResponse<{ facts?: unknown; error?: string }>(res);
    if (!res.ok) throw new Error(data.error ?? "Extraction failed");
    return normalizeExtractedFacts(data.facts);
  };

  const extractScreenshots = async (
    managed?: boolean,
    signal?: AbortSignal,
    shots = screenshots,
  ): Promise<ExtractedProfileFacts> => {
    if (!shots.length) {
      const empty = emptyExtractedFacts();
      setFacts(empty);
      return empty;
    }
    const hashes = await Promise.all(shots.map(hashDataUrl));
    const cached = getCachedExtractedFacts(hashes);
    if (cached) {
      const c = normalizeExtractedFacts(cached);
      setFacts(c);
      return c;
    }
    if (!managed) {
      setBusy(true);
      setGenPhase("extract");
      setGenStartedAt(Date.now());
      setGenDetail(`Reading ${shots.length} screenshot(s)…`);
    } else {
      setGenPhase("extract");
      setGenDetail(`Reading ${shots.length} screenshot(s)…`);
    }
    setError("");
    try {
      const parts = await mapWithConcurrency(
        shots,
        EXTRACT_CONCURRENCY,
        (shot) => extractOne(shot, signal),
      );
      let merged = emptyExtractedFacts();
      for (const part of parts) {
        merged = mergeExtractedFacts(merged, part);
      }
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      setFacts(merged);
      cacheExtractedFacts(hashes, merged);
      return merged;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      const msg = e instanceof Error ? e.message : "Extraction failed";
      setError(msg);
      throw e;
    } finally {
      if (!managed) {
        setBusy(false);
        setGenPhase(null);
        setGenDetail("");
      }
    }
  };

  const generate = async () => {
    if (!intake.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!intake.articleTitle.trim()) {
      setError("Please enter your article title.");
      return;
    }
    const intakeFinal = intake;
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setBusy(true);
    setGenStartedAt(Date.now());
    setGenPhase(screenshots.length > 0 ? "extract" : "generate");
    setGenDetail(
      screenshots.length > 0
        ? "Reading your screenshots…"
        : "Writing your Wikipedia article…",
    );
    setError("");
    try {
      setGenDetail("Optimizing images for upload…");
      let prepared = await prepareUploadImages({
        headshot: headshot[0],
        screenshots,
        extraPhotos,
      });
      if (prepared.headshot) setHeadshot([prepared.headshot]);
      if (prepared.screenshots.length) setScreenshots(prepared.screenshots);
      if (prepared.extraPhotos.length) setExtraPhotos(prepared.extraPhotos);

      let extracted = facts;
      if (prepared.screenshots.length > 0) {
        extracted = await extractScreenshots(true, signal, prepared.screenshots);
        if (signal.aborted) return;
        setGenPhase("generate");
        setGenDetail("Writing your Wikipedia article…");
      }
      extracted = normalizeExtractedFacts(extracted);

      const postGenerate = (images: typeof prepared) =>
        fetch("/api/generate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intake: intakeFinal,
            facts: extracted,
            headshotDataUrl: images.headshot,
            extraPhotoUrls: images.extraPhotos,
          }),
          signal,
        });

      let res = await postGenerate(prepared);
      if (res.status === 413) {
        setGenDetail("Images still large — compressing further…");
        prepared = await prepareUploadImages(
          {
            headshot: prepared.headshot,
            screenshots: prepared.screenshots,
            extraPhotos: prepared.extraPhotos,
          },
          true,
        );
        if (prepared.headshot) setHeadshot([prepared.headshot]);
        setScreenshots(prepared.screenshots);
        setExtraPhotos(prepared.extraPhotos);
        res = await postGenerate(prepared);
      }
      const data = await parseJsonResponse<{
        article?: import("@/types/article").ArticleJson;
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
        mock?: boolean;
      }>(res);
      if (!res.ok) {
        const detail = data.details?.fieldErrors
          ? Object.entries(data.details.fieldErrors)
              .map(([k, v]) => `${k}: ${v.join(", ")}`)
              .join("; ")
          : "";
        throw new Error(
          detail
            ? `${data.error ?? "Generation failed"} — ${detail}`
            : (data.error ?? "Generation failed"),
        );
      }

      const article = data.article!;
      if (prepared.headshot) {
        article.infobox.imageUrl = prepared.headshot;
      }

      const articleId = nanoid();
      const articleSlug = nanoid(10);
      const sessionPayload = {
        article,
        intake: intakeFinal,
        headshotDataUrl: prepared.headshot ?? "",
        extraPhotoUrls: prepared.extraPhotos,
        facts: extracted,
        mock: data.mock,
        savedId: articleId,
        slug: articleSlug,
      };

      try {
        sessionStorage.setItem("wikime_current", JSON.stringify(sessionPayload));
      } catch {
        sessionStorage.setItem(
          "wikime_current",
          JSON.stringify({
            ...sessionPayload,
            article: { ...article, infobox: { ...article.infobox, imageUrl: "" } },
            headshotDataUrl: "",
          }),
        );
      }

      setGenPhase("save");
      setGenDetail("Saving your share link…");
      const toSave = prepareArticleForDb({
        id: articleId,
        slug: articleSlug,
        articleJson: article,
        mode: intakeFinal.mode,
        intake: intakeFinal,
        headshotDataUrl: prepared.headshot,
        extraPhotoUrls: prepared.extraPhotos,
        extractedFacts: extracted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const saved = await saveArticleToServer(toSave);
      if (signal.aborted) return;

      if (!saved.ok) {
        throw new Error(saved.error);
      }

      router.push(`/article?slug=${saved.slug}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      abortRef.current = null;
      setBusy(false);
      setGenPhase(null);
      setGenDetail("");
    }
  };

  const saved = getSavedArticles();
  const isMobile = useIsMobile();
  const hasUploads = headshot.length > 0 || screenshots.length > 0;

  return (
    <div className={`min-h-screen bg-slate-50 ${isMobile ? "intake-mobile-page" : ""}`}>
      {busy && genPhase && (
        <GenerationProgress
          phase={genPhase}
          detail={genDetail}
          startedAt={genStartedAt}
          onCancel={cancelGeneration}
          canCancel
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-1 safe-top">
        <p className="text-sm text-slate-500 text-right">Step {step} of 3</p>
      </div>

      <main className={`max-w-3xl mx-auto px-6 pb-16 ${busy ? "ui-busy" : ""}`}>
        {step === 1 && (
          <section className={isMobile ? "px-0 -mx-2" : ""}>
            <IntakeFlow
              value={intake}
              onChange={setIntake}
              onComplete={() => setStep(2)}
              disabled={busy}
            />
          </section>
        )}

        {step === 2 && (
          <section className="pb-24">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Uploads</h1>
            <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
              <HeadshotUploader
                label="Headshot (for infobox)"
                image={headshot[0] ?? ""}
                subjectName={intake.fullName || intake.articleTitle}
                onChange={(url) => setHeadshot(url ? [url] : [])}
                disabled={busy}
              />
              <div className="mt-8">
                <ScreenshotUploader
                  label="Social profile screenshots"
                  multiple
                  images={screenshots}
                  onChange={setScreenshots}
                />
              </div>
              <div className="mt-8">
                <ExtraPhotosUploader
                  images={extraPhotos}
                  onChange={setExtraPhotos}
                  disabled={busy}
                />
              </div>
              {screenshots.length > 0 && (
                <LoadingButton
                  className="btn-secondary mt-4"
                  loading={busy}
                  loadingLabel="Extracting…"
                  onClick={() => void extractScreenshots()}
                  disabled={busy}
                >
                  Preview extract facts
                </LoadingButton>
              )}
              <div className="intake-mobile-actions static mt-8 !bg-transparent">
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    className="btn-secondary intake-mobile-btn flex-1"
                    onClick={() => setStep(1)}
                    disabled={busy}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary intake-mobile-btn flex-1"
                    onClick={() => setStep(3)}
                    disabled={busy}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </fieldset>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Generate</h1>
            <p className="text-slate-600 mb-6">
              Mode: <strong>{intake.mode === "creative" ? "Creative" : "Realism"}</strong>
              {" · "}
              Length: <strong>{intake.articleLength}</strong>
            </p>
            <LoadingButton
              loading={busy}
              loadingLabel="Generating…"
              onClick={() => void generate()}
              disabled={busy}
            >
              Generate article
            </LoadingButton>
            <button
              type="button"
              className="btn-secondary ml-3"
              onClick={() => setStep(2)}
              disabled={busy}
            >
              Back
            </button>
          </section>
        )}

        {error && !busy && (
          <div className="generate-error-banner mt-4" role="alert">
            <p className="generate-error-text">{error}</p>
            {hasUploads && (
              <p className="generate-error-hint">
                Your images are still loaded — try Generate again (we auto-resize photos before upload).
              </p>
            )}
            {step === 3 && (
              <button
                type="button"
                className="btn-primary mt-3"
                onClick={() => {
                  setError("");
                  void generate();
                }}
              >
                Retry generation
              </button>
            )}
          </div>
        )}

        {saved.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <h2 className="font-semibold text-slate-900 mb-3">Saved locally</h2>
            <ul className="space-y-2">
              {saved.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/article?id=${a.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {a.articleJson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <GenerateFlow />
    </Suspense>
  );
}
