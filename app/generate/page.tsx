"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createDefaultIntake } from "@/components/IntakeForm";
import { enrichIntakeControversies } from "@/lib/intakeControversies";
import { mergeLegacyIntakeFields } from "@/lib/mergeLegacyIntake";
import { CreateArticleForm } from "@/components/intake/CreateArticleForm";
import {
  articleImageMetrics,
  ensureArticleImages,
  formatArticleImageMetrics,
} from "@/lib/articleImages";
import { enrichFactsWithIntake } from "@/lib/enrichFactsWithIntake";
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
import {
  adminTestHeaders,
  apiErrorMessage,
  type ApiErrorBody,
} from "@/lib/adminFetch";
import { type ExtraPhotoUpload } from "@/lib/extraPhotoUpload";
import { prepareUploadImages } from "@/lib/prepareUploadImages";
import { saveArticleToServer } from "@/lib/saveArticleClient";
import { mapWithConcurrency } from "@/lib/parallelMap";
import { nanoid } from "nanoid";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { GenerationProgress } from "@/components/GenerationProgress";
import {
  appendGenerationLog,
  completeGenerationStep,
  createGenerationRun,
  formatGenerationError,
  mergeServerAdminLog,
  skipGenerationStep,
  startGenerationStep,
  type GenerationRunState,
} from "@/lib/generationRun";
import { runGenerationStep } from "@/lib/generationRunClient";
import { fetchWithTimeout } from "@/lib/fetchTimeout";

const EXTRACT_CONCURRENCY = 3;
const EXTRACT_FETCH_TIMEOUT_MS = 90_000;
const GENERATE_FETCH_TIMEOUT_MS = 300_000;

function GenerateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "creative" ? "creative" : "realism";

  const [intake, setIntake] = useState<IntakeData>(() =>
    createDefaultIntake(initialMode),
  );
  const [headshot, setHeadshot] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [extraPhotos, setExtraPhotos] = useState<ExtraPhotoUpload[]>([]);
  const [facts, setFacts] = useState<ExtractedProfileFacts>(emptyExtractedFacts());
  const [busy, setBusy] = useState(false);
  const [genPhase, setGenPhase] = useState<"extract" | "generate" | "save" | null>(
    null,
  );
  const [genDetail, setGenDetail] = useState("");
  const [genStartedAt, setGenStartedAt] = useState(0);
  const [error, setError] = useState("");
  const [genRun, setGenRun] = useState<GenerationRunState | null>(null);
  const isAdmin = useIsAdmin();
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
        ...enrichIntakeControversies(
          mergeLegacyIntakeFields(
            draft.intake as unknown as Record<string, unknown>,
          ),
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

  const dismissGeneration = () => {
    setGenRun(null);
    setGenPhase(null);
    setGenDetail("");
    setBusy(false);
    setError("");
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    dismissGeneration();
    setError("Generation cancelled. Your uploads and intake answers are still here.");
  };

  const fetchExtractOne = async (
    shot: string,
    signal?: AbortSignal,
  ): Promise<ExtractedProfileFacts> => {
    const res = await fetchWithTimeout(
      "/api/extract-profile",
      {
        method: "POST",
        headers: adminTestHeaders(isAdmin),
        body: JSON.stringify({ screenshots: [shot] }),
        signal,
      },
      EXTRACT_FETCH_TIMEOUT_MS,
    );
    const data = await parseJsonResponse<ApiErrorBody & { facts?: unknown }>(res);
    if (!res.ok) {
      throw new Error(apiErrorMessage(data, res));
    }
    if (isAdmin && data.adminLog?.length) {
      setGenRun((r) =>
        r ? mergeServerAdminLog(r, data.adminLog, "extract") : r,
      );
    }
    return normalizeExtractedFacts(data.facts);
  };

  const extractOne = async (
    shot: string,
    signal?: AbortSignal,
  ): Promise<ExtractedProfileFacts> => fetchExtractOne(shot, signal);

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

    const shotCount = screenshots.length;
    setBusy(true);
    setGenStartedAt(Date.now());
    setError("");
    setGenRun(createGenerationRun(shotCount));
    setGenDetail(
      shotCount > 0
        ? "Starting — optimizing images and reading screenshots…"
        : "Starting — preparing your article…",
    );

    let adminFailed = false;

    try {
      const runStep = async <T,>(
        stepId: string,
        label: string,
        fn: () => Promise<T>,
      ): Promise<T> => {
        setGenDetail(label);
        return runGenerationStep(setGenRun, stepId, fn, label);
      };

      let prepared = await runStep(
        "prepare-images",
        "Optimizing images for upload…",
        () =>
          prepareUploadImages({
            headshot: headshot[0],
            screenshots,
            extraPhotos,
          }),
      );
      if (prepared.headshot) setHeadshot([prepared.headshot]);
      if (prepared.screenshots.length) setScreenshots(prepared.screenshots);
      if (prepared.extraPhotos.length) setExtraPhotos(prepared.extraPhotos);

      let extracted = facts;
      if (prepared.screenshots.length > 0) {
        const hashes = await Promise.all(prepared.screenshots.map(hashDataUrl));
        const cached = getCachedExtractedFacts(hashes);
        if (cached) {
          setGenRun((r) => {
            if (!r) return r;
            let next = appendGenerationLog(r, "info", "Using cached screenshot extract");
            for (let i = 0; i < prepared.screenshots.length; i++) {
              next = skipGenerationStep(
                next,
                `extract-${i}`,
                "Cached from earlier extract",
              );
            }
            return next;
          });
          extracted = normalizeExtractedFacts(cached);
        } else {
          let merged = emptyExtractedFacts();
          for (let i = 0; i < prepared.screenshots.length; i++) {
            const part = await runStep(
              `extract-${i}`,
              `Extracting screenshot ${i + 1} of ${prepared.screenshots.length}…`,
              () => fetchExtractOne(prepared.screenshots[i], signal),
            );
            merged = mergeExtractedFacts(merged, part);
          }
          cacheExtractedFacts(hashes, merged);
          extracted = merged;
        }
        if (signal.aborted) return;
      }
      extracted = enrichFactsWithIntake(
        normalizeExtractedFacts(extracted),
        intakeFinal,
      );

      if (isAdmin) {
        setGenRun((r) =>
          r
            ? appendGenerationLog(
                r,
                "info",
                `Facts for AI: education=${extracted.education.length}, work=${extracted.work.length}, raw=${extracted.rawUsefulText.length}`,
                "generate",
              )
            : r,
        );
      }

      const postGenerate = (images: typeof prepared) =>
        fetchWithTimeout(
          "/api/generate-article",
          {
            method: "POST",
            headers: adminTestHeaders(isAdmin),
            body: JSON.stringify({
              intake: intakeFinal,
              facts: extracted,
              headshotDataUrl: images.headshot,
              extraPhotos: images.extraPhotos.map((p) => ({
                dataUrl: p.dataUrl,
                description: p.description.trim() || undefined,
              })),
            }),
            signal,
          },
          GENERATE_FETCH_TIMEOUT_MS,
        );

      const parseGenerateResponse = async (res: Response) => {
        const data = await parseJsonResponse<
          ApiErrorBody & {
            article?: import("@/types/article").ArticleJson;
            mock?: boolean;
            details?: { fieldErrors?: Record<string, string[]> };
          }
        >(res);
        if (!res.ok) {
          if (isAdmin && data.adminLog?.length) {
            setGenRun((r) =>
              r ? mergeServerAdminLog(r, data.adminLog, "generate") : r,
            );
          }
          const detail = data.details?.fieldErrors
            ? Object.entries(data.details.fieldErrors)
                .map(([k, v]) => `${k}: ${v.join(", ")}`)
                .join("; ")
            : "";
          const msg = apiErrorMessage(data, res);
          throw new Error(detail ? `${msg} — ${detail}` : msg);
        }
        if (isAdmin && data.adminLog?.length) {
          setGenRun((r) => {
            if (!r) return r;
            let next = r;
            for (const line of data.adminLog!) {
              next = appendGenerationLog(next, "info", `[server] ${line}`, "generate");
            }
            return next;
          });
        }
        return data;
      };

      const callGenerateApi = async (images: typeof prepared) => {
        const res = await postGenerate(images);
        if (res.status === 413) return { ok: false as const, res };
        const data = await parseGenerateResponse(res);
        return { ok: true as const, data, res };
      };

      setGenRun((r) =>
        r
          ? startGenerationStep(r, "generate", "Writing your Wikipedia article (AI)…")
          : r,
      );

      let genOutcome = await callGenerateApi(prepared);
      if (!genOutcome.ok) {
        setGenDetail("Images still large — compressing further…");
        prepared = await runStep(
          "prepare-images",
          "Images still large — compressing further…",
          () =>
            prepareUploadImages(
              {
                headshot: prepared.headshot,
                screenshots: prepared.screenshots,
                extraPhotos: prepared.extraPhotos,
              },
              true,
            ),
        );
        if (prepared.headshot) setHeadshot([prepared.headshot]);
        setScreenshots(prepared.screenshots);
        setExtraPhotos(prepared.extraPhotos);
        setGenRun((r) =>
          r
            ? startGenerationStep(
                r,
                "generate",
                "Retrying article generation after compression…",
              )
            : r,
        );
        genOutcome = await callGenerateApi(prepared);
        if (!genOutcome.ok) {
          throw new Error(
            "Upload too large even after compression. Try fewer or smaller images.",
          );
        }
      }

      setGenRun((r) =>
        r ? completeGenerationStep(r, "generate", "Article JSON received") : r,
      );

      const data = genOutcome.data;
      let article = data.article!;
      article = ensureArticleImages(
        article,
        prepared.headshot,
        prepared.extraPhotos,
        intakeFinal.fullName || intakeFinal.articleTitle,
      );

      const imageReport = formatArticleImageMetrics(
        articleImageMetrics(article, prepared.headshot),
      );
      if (isAdmin) {
        setGenRun((r) =>
          r
            ? appendGenerationLog(r, "info", `Post-process images: ${imageReport}`, "generate")
            : r,
        );
      }

      const articleId = nanoid();
      const articleSlug = nanoid(10);
      const sessionPayload = {
        article,
        intake: intakeFinal,
        headshotDataUrl: prepared.headshot ?? "",
        extraPhotoUrls: prepared.extraPhotos.map((p) => p.dataUrl),
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
            extraPhotoUrls: [],
          }),
        );
      }

      const toSave = await prepareArticleForDb({
        id: articleId,
        slug: articleSlug,
        articleJson: article,
        mode: intakeFinal.mode,
        intake: intakeFinal,
        headshotDataUrl: prepared.headshot,
        extraPhotoUrls: prepared.extraPhotos.map((p) => p.dataUrl),
        extractedFacts: extracted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (isAdmin) {
        setGenRun((r) =>
          r
            ? appendGenerationLog(
                r,
                "info",
                `Save payload: headshot=${toSave.headshotDataUrl ? `${Math.round((toSave.headshotDataUrl.length ?? 0) / 1024)}KB` : "none"}, figures=${formatArticleImageMetrics(articleImageMetrics(toSave.articleJson, toSave.headshotDataUrl))}`,
                "save",
              )
            : r,
        );
      }

      const saved = await runStep("save", "Saving article to server…", async () => {
        const result = await saveArticleToServer(toSave, { isAdmin });
        if (!result.ok) throw new Error(result.error);
        return result;
      });

      if (signal.aborted) return;

      setGenRun((r) => {
        if (isAdmin && r) {
          void fetch("/api/admin/generation-runs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: intakeFinal.mode,
              success: true,
              logs: r.logs,
              steps: r.steps,
              metrics: {
                imageReport,
                slug: saved.slug,
              },
            }),
          });
        }
        return null;
      });
      router.push(`/article?slug=${saved.slug}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      adminFailed = true;
      const msg = formatGenerationError(e);
      setError(msg);
      setGenRun((r) => {
        const failed = r ? { ...r, failed: true, errorMessage: msg } : r;
        if (isAdmin && failed) {
          void fetch("/api/admin/generation-runs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: intake.mode,
              success: false,
              errorMessage: msg,
              logs: failed.logs,
              steps: failed.steps,
            }),
          });
        }
        return failed;
      });
    } finally {
      abortRef.current = null;
      setBusy(false);
      if (!adminFailed) {
        setGenPhase(null);
        setGenDetail("");
        setGenRun(null);
      }
    }
  };

  const saved = getSavedArticles();
  const hasUploads =
    headshot.length > 0 || screenshots.length > 0 || extraPhotos.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {genRun && (
        <GenerationProgress
          detail={genDetail}
          startedAt={genStartedAt}
          onCancel={genRun.failed || error ? undefined : cancelGeneration}
          canCancel={busy && !genRun.failed && !error}
          steps={genRun.steps}
          logs={isAdmin ? genRun.logs : undefined}
          showAdminBadge={isAdmin}
          errorMessage={genRun.errorMessage ?? error ?? undefined}
          hasUploads={hasUploads}
          onDismiss={genRun.failed || (error && !busy) ? dismissGeneration : undefined}
        />
      )}

      <main className={`max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 safe-top ${busy ? "ui-busy" : ""}`}>
        <CreateArticleForm
          intake={intake}
          onIntakeChange={setIntake}
          headshot={headshot[0] ?? ""}
          onHeadshotChange={(url) => setHeadshot(url ? [url] : [])}
          screenshots={screenshots}
          onScreenshotsChange={setScreenshots}
          extraPhotos={extraPhotos}
          onExtraPhotosChange={setExtraPhotos}
          busy={busy}
          onGenerate={() => void generate()}
          onExtractScreenshots={() => void extractScreenshots()}
          generateError={error && !genRun ? error : undefined}
          onClearGenerateError={() => setError("")}
        />

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
