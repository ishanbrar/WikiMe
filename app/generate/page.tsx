"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
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
import type {
  ArticleJson,
  ArticleMode,
  ExtractedProfileFacts,
  IntakeData,
} from "@/types/article";
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
  createGenerationRun,
  failGenerationStep,
  formatGenerationError,
  mergeServerAdminLog,
  skipGenerationStep,
  type GenerationRunState,
} from "@/lib/generationRun";
import { runGenerationStep } from "@/lib/generationRunClient";
import { fetchWithTimeout } from "@/lib/fetchTimeout";
import { isTransientHttpStatus, withTransientRetry } from "@/lib/transientRetry";
import {
  mergeSmartParseIntoIntake,
  smartParseIntake,
  type IntakeSmartParse,
} from "@/lib/smartParseIntake";
import { extractUrlsFromText } from "@/lib/sourceUrlScan";
import type { LinkExtractionStatus } from "@/lib/linkExtraction";

const EXTRACT_CONCURRENCY = 3;
const EXTRACT_FETCH_TIMEOUT_MS = 90_000;
const GENERATE_FETCH_TIMEOUT_MS = 300_000;

type ClientLinkExtractionResult = {
  facts: ExtractedProfileFacts;
  statuses: LinkExtractionStatus[];
};

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
  const [generateCreativeVersion, setGenerateCreativeVersion] = useState(true);
  const [linkFacts, setLinkFacts] = useState<ExtractedProfileFacts | null>(null);
  const [linkStatuses, setLinkStatuses] = useState<LinkExtractionStatus[]>([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const isAdmin = useIsAdmin();
  const abortRef = useRef<AbortController | null>(null);
  const genRunRef = useRef<GenerationRunState | null>(null);

  const setGenerationRun = useCallback(
    (
      value:
        | GenerationRunState
        | null
        | ((prev: GenerationRunState | null) => GenerationRunState | null),
    ) => {
      setGenRun((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        genRunRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    genRunRef.current = genRun;
  }, [genRun]);

  useEffect(() => {
    const draft = loadDraft<{
      intake: IntakeData;
      headshot: string[];
      screenshots: string[];
      facts: ExtractedProfileFacts;
    }>();
    if (draft?.intake) {
      queueMicrotask(() => {
        setIntake({
          ...createDefaultIntake(initialMode),
          ...enrichIntakeControversies(
            mergeLegacyIntakeFields(
              draft.intake as unknown as Record<string, unknown>,
            ),
          ),
        } as IntakeData);
        setFacts(normalizeExtractedFacts(draft.facts ?? emptyExtractedFacts()));
      });
    }
  }, []);

  const persistDraft = useCallback(() => {
    saveDraft({ intake, facts, hasImages: headshot.length > 0 || screenshots.length > 0 });
  }, [intake, headshot, screenshots, facts]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const smartParsed: IntakeSmartParse = useMemo(
    () => smartParseIntake(intake),
    [intake],
  );

  const intakeTextForLinks = useCallback(
    (value: IntakeData) =>
      [
        value.fullName,
        value.articleTitle,
        value.birthplace,
        value.birthday,
        value.currentLocation,
        value.education,
        value.occupation,
        value.achievements,
        value.lifeEvents,
        value.controversies,
        value.extraNotes,
        value.pastedProfileText,
        value.instagramUrl,
        value.linkedinUrl,
        value.xUrl,
      ].join("\n"),
    [],
  );

  const extractLinkSources = useCallback(
    async (
      intakeValue = intake,
      factsValue: ExtractedProfileFacts = facts,
      managed = false,
    ): Promise<ClientLinkExtractionResult> => {
      const urls = extractUrlsFromText(
        [
          intakeTextForLinks(intakeValue),
          factsValue.links.join("\n"),
          factsValue.rawUsefulText.join("\n"),
        ].join("\n"),
      );
      if (!urls.length) {
        setLinkStatuses([]);
        setLinkFacts(null);
        return { facts: factsValue, statuses: [] };
      }

      const cacheKey = `wikime_link_extract:${urls.join("|")}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            facts?: ExtractedProfileFacts;
            statuses?: LinkExtractionStatus[];
          };
          const normalized = normalizeExtractedFacts(parsed.facts);
          const statuses = parsed.statuses ?? [];
          setLinkFacts(normalized);
          setLinkStatuses(statuses);
          return { facts: normalized, statuses };
        }
      } catch {
        // Session cache is opportunistic.
      }

      if (!managed) setLinkBusy(true);
      try {
        const res = await fetchWithTimeout(
          "/api/extract-links",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intake: intakeValue, facts: factsValue }),
          },
          90_000,
        );
        const data = await parseJsonResponse<
          ApiErrorBody & {
            facts?: ExtractedProfileFacts;
            statuses?: LinkExtractionStatus[];
            logs?: string[];
          }
        >(res);
        if (!res.ok) throw new Error(apiErrorMessage(data, res));
        const normalized = normalizeExtractedFacts(data.facts);
        const statuses = data.statuses ?? [];
        setLinkFacts(normalized);
        setLinkStatuses(statuses);
        if (isAdmin && data.logs?.length) {
          setGenerationRun((r) =>
            r ? mergeServerAdminLog(r, data.logs!, "read-links") : r,
          );
        }
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ facts: normalized, statuses }),
          );
        } catch {
          // Large source summaries may exceed storage; generation can continue.
        }
        return { facts: normalized, statuses };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Link extraction failed";
        const statuses = urls.map((url) => ({
          url,
          status: "failed" as const,
          detail: message,
        }));
        setLinkStatuses(statuses);
        if (managed) {
          setGenerationRun((r) =>
            r
              ? appendGenerationLog(
                  r,
                  "warn",
                  `Linked sources were skipped: ${message}`,
                  "read-links",
                )
              : r,
          );
        } else {
          setError(message);
        }
        return { facts: factsValue, statuses };
      } finally {
        if (!managed) setLinkBusy(false);
      }
    },
    [facts, intake, intakeTextForLinks, isAdmin, setGenerationRun],
  );

  const applySmartParsed = useCallback(() => {
    setIntake((prev) => mergeSmartParseIntoIntake(prev, smartParseIntake(prev)));
  }, []);

  const dismissGeneration = () => {
    setGenerationRun(null);
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
    return withTransientRetry(
      async () => {
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
        if (isTransientHttpStatus(res.status)) {
          await res.text().catch(() => "");
          throw new Error(`Extract API HTTP ${res.status} (transient).`);
        }
        const data = await parseJsonResponse<ApiErrorBody & { facts?: unknown }>(res);
        if (!res.ok) {
          throw new Error(apiErrorMessage(data, res));
        }
        if (isAdmin && data.adminLog?.length) {
          setGenerationRun((r) =>
            r ? mergeServerAdminLog(r, data.adminLog, "extract") : r,
          );
        }
        return normalizeExtractedFacts(data.facts);
      },
      { maxAttempts: 4, baseDelayMs: 700, label: "extract-profile" },
    );
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
    let generationLinkStatuses = linkStatuses;

    const shotCount = screenshots.length;
    setBusy(true);
    setGenStartedAt(Date.now());
    setError("");
    const initialRun = createGenerationRun(shotCount);
    genRunRef.current = initialRun;
    setGenerationRun(initialRun);
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
        return runGenerationStep(setGenerationRun, stepId, fn, label);
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
          setGenerationRun((r) => {
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

      const urls = extractUrlsFromText(
        [
          intakeTextForLinks(intakeFinal),
          extracted.links.join("\n"),
          extracted.rawUsefulText.join("\n"),
        ].join("\n"),
      );
      if (urls.length) {
        extracted = await runStep(
          "read-links",
          `Reading linked sources — fetched 0/${urls.length}…`,
          async () => {
            const next = await extractLinkSources(intakeFinal, extracted, true);
            generationLinkStatuses = next.statuses;
            const fetched = next.statuses.filter((s) =>
              s.status === "fetched" || s.status === "pdf"
            ).length;
            setGenerationRun((r) =>
              r
                ? appendGenerationLog(
                    r,
                    "info",
                    `Link extraction complete: ${fetched}/${urls.length} readable`,
                    "read-links",
                  )
                : r,
            );
            return next.facts;
          },
        );
      } else {
        setGenerationRun((r) =>
          r ? skipGenerationStep(r, "read-links", "No pasted links found") : r,
        );
      }

      extracted = await runStep(
        "prepare-facts",
        "Preparing profile facts for the article…",
        async () => {
          const next = enrichFactsWithIntake(
            normalizeExtractedFacts(extracted),
            intakeFinal,
          );
          if (isAdmin) {
            setGenerationRun((r) =>
              r
                ? appendGenerationLog(
                    r,
                    "info",
                    `Facts for AI: education=${next.education.length}, work=${next.work.length}, raw=${next.rawUsefulText.length}`,
                    "prepare-facts",
                  )
                : r,
            );
          }
          return next;
        },
      );

      if (signal.aborted) return;

      const generateStepId = (mode: ArticleMode) =>
        mode === "realism" ? "generate-realism" : "generate-creative";
      const generateLabel = (mode: ArticleMode) =>
        mode === "realism"
          ? "Writing Realism article (AI)…"
          : "Writing Creative article (AI)…";

      const updateRunDetail = (stepId: string, detail: string) => {
        setGenDetail(detail);
        setGenerationRun((r) =>
          r
            ? {
                ...r,
                steps: r.steps.map((s) =>
                  s.id === stepId && s.status === "active"
                    ? { ...s, detail }
                    : s,
                ),
              }
            : r,
        );
      };

      const postGenerate = (images: typeof prepared, mode: ArticleMode) =>
        fetchWithTimeout(
          "/api/generate-article",
          {
            method: "POST",
            headers: adminTestHeaders(isAdmin),
            body: JSON.stringify({
              intake: { ...intakeFinal, mode },
              facts: extracted,
              headshotDataUrl: images.headshot,
              extraPhotos: images.extraPhotos.map((p) => ({
                dataUrl: p.dataUrl,
                description: p.description.trim() || undefined,
                targetSection: p.targetSection?.trim() || undefined,
                caption: p.caption?.trim() || undefined,
              })),
            }),
            signal,
          },
          GENERATE_FETCH_TIMEOUT_MS,
        );

      const parseGenerateResponse = async (res: Response, stepId: string) => {
        const data = await parseJsonResponse<
          ApiErrorBody & {
            article?: import("@/types/article").ArticleJson;
            mock?: boolean;
            details?: { fieldErrors?: Record<string, string[]> };
          }
        >(res);
        if (!res.ok) {
          if (isAdmin && data.adminLog?.length) {
            setGenerationRun((r) =>
              r ? mergeServerAdminLog(r, data.adminLog, stepId) : r,
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
          setGenerationRun((r) => {
            if (!r) return r;
            let next = r;
            for (const line of data.adminLog!) {
              next = appendGenerationLog(next, "info", `[server] ${line}`, stepId);
            }
            return next;
          });
        }
        return data;
      };

      type GenerateOutcome =
        | { ok: false; res: Response; mode: ArticleMode }
        | {
            ok: true;
            data: {
              article?: ArticleJson;
              mock?: boolean;
              adminLog?: string[];
            };
            res: Response;
            mode: ArticleMode;
          };

      const callGenerateApi = async (
        images: typeof prepared,
        mode: ArticleMode,
      ): Promise<GenerateOutcome> => {
        const stepId = generateStepId(mode);
        const started = Date.now();
        return withTransientRetry(
          async () => {
            try {
              updateRunDetail(stepId, `${generateLabel(mode)} Contacting AI…`);
              const res = await postGenerate(images, mode);
              if (res.status === 413) return { ok: false as const, res, mode };
              if (isTransientHttpStatus(res.status)) {
                await res.text().catch(() => "");
                throw new Error(`Article API returned HTTP ${res.status} (transient).`);
              }
              const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
              updateRunDetail(stepId, `${generateLabel(mode)} Received draft after ${seconds}s; validating…`);
              const data = await parseGenerateResponse(res, stepId);
              return { ok: true as const, data, res, mode };
            } catch (e) {
              const phase = mode === "realism" ? "Realism article" : "Creative article";
              throw new Error(`${phase}: ${formatGenerationError(e)}`);
            }
          },
          { maxAttempts: 4, baseDelayMs: 900, label: `generate-${mode}` },
        );
      };

      const compressFor413 = async (images: typeof prepared) => {
        setGenDetail("Images still large — compressing further…");
        const compressed = await runStep(
          "prepare-images",
          "Images still large — compressing further…",
          () =>
            prepareUploadImages(
              {
                headshot: images.headshot,
                screenshots: images.screenshots,
                extraPhotos: images.extraPhotos,
              },
              true,
            ),
        );
        if (compressed.headshot) setHeadshot([compressed.headshot]);
        setScreenshots(compressed.screenshots);
        setExtraPhotos(compressed.extraPhotos);
        return compressed;
      };

      const generateRequestedModes = async (images: typeof prepared) => {
        setGenDetail("Writing Realism article (AI)…");
        let realism = await runStep(
          "generate-realism",
          "Writing Realism article (AI)…",
          () => callGenerateApi(images, "realism"),
        );
        if (!realism.ok) {
          images = await compressFor413(images);
          setGenDetail("Retrying Realism article (AI)…");
          realism = await runStep(
            "generate-realism",
            "Retrying Realism article after image compression…",
            () => callGenerateApi(images, "realism"),
          );
          if (!realism.ok) {
            throw new Error(
              "Upload too large even after compression. Try fewer or smaller images.",
            );
          }
        }

        if (!generateCreativeVersion) {
          setGenerationRun((r) =>
            r
              ? skipGenerationStep(
                  r,
                  "generate-creative",
                  "Realism only selected",
                )
              : r,
          );
          return { images, outcomes: [realism] as GenerateOutcome[] };
        }

        setGenDetail("Writing Creative article (AI)…");
        let creative = await runStep(
          "generate-creative",
          "Writing Creative article (AI)…",
          () => callGenerateApi(images, "creative"),
        );
        if (!creative.ok) {
          images = await compressFor413(images);
          setGenDetail("Retrying Creative article (AI)…");
          creative = await runStep(
            "generate-creative",
            "Retrying Creative article after image compression…",
            () => callGenerateApi(images, "creative"),
          );
          if (!creative.ok) {
            throw new Error(
              "Upload too large even after compression. Try fewer or smaller images.",
            );
          }
        }

        return { images, outcomes: [realism, creative] as GenerateOutcome[] };
      };

      const { images: imagesFinal, outcomes } = await generateRequestedModes(prepared);
      prepared = imagesFinal;

      const realismOutcome = outcomes.find((o) => o.ok && o.mode === "realism");
      const creativeOutcome = outcomes.find((o) => o.ok && o.mode === "creative");
      if (!realismOutcome?.ok || (generateCreativeVersion && !creativeOutcome?.ok)) {
        const bad = outcomes.filter((o) => !o.ok);
        const detail = bad
          .map((o) => `${o.mode}: HTTP ${o.res.status}`)
          .join("; ");
        throw new Error(
          `Article generation did not complete (${detail}). Try a shorter length or fewer images, then generate again.`,
        );
      }

      const realismSlug = nanoid(10);
      const creativeSlug = generateCreativeVersion ? nanoid(10) : "";
      const realismId = nanoid();
      const creativeId = generateCreativeVersion ? nanoid() : "";
      const primaryMode: ArticleMode = generateCreativeVersion ? intakeFinal.mode : "realism";
      const {
        realismSave,
        creativeSave,
        imageReport,
      } = await runStep("post-process", "Assembling article pages and images…", async () => {
        const subjectLabel = intakeFinal.fullName || intakeFinal.articleTitle;
        const finishArticle = (raw: ArticleJson, mode: ArticleMode) => {
          const article = ensureArticleImages(
            raw,
            prepared.headshot,
            prepared.extraPhotos,
            subjectLabel,
          );
          const intakeForMode: IntakeData = { ...intakeFinal, mode };
          return { article, intakeForMode };
        };

        const realismPack = finishArticle(realismOutcome.data.article!, "realism");
        const creativePack =
          generateCreativeVersion && creativeOutcome?.ok
            ? finishArticle(creativeOutcome.data.article!, "creative")
            : null;
        const primaryPack =
          primaryMode === "creative" && creativePack ? creativePack : realismPack;
        const primarySlug =
          primaryMode === "creative" && creativeSlug ? creativeSlug : realismSlug;

        const imageReportNext = formatArticleImageMetrics(
          articleImageMetrics(primaryPack.article, prepared.headshot),
        );
        if (isAdmin) {
          setGenerationRun((r) =>
            r
              ? appendGenerationLog(
                  r,
                  "info",
                  `Post-process images: ${imageReportNext}; slugs=${[realismSlug, creativeSlug].filter(Boolean).join(", ")}`,
                  "post-process",
                )
              : r,
          );
        }

        const sessionPayload = {
          article: primaryPack.article,
          intake: primaryPack.intakeForMode,
          headshotDataUrl: prepared.headshot ?? "",
          extraPhotoUrls: prepared.extraPhotos.map((p) => p.dataUrl),
          facts: extracted,
          mock: realismOutcome.data.mock,
          savedId: primaryMode === "creative" ? creativeId : realismId,
          slug: primarySlug,
          alternateSlug: generateCreativeVersion
            ? primaryMode === "creative"
              ? realismSlug
              : creativeSlug
            : undefined,
          mode: primaryMode,
          linkStatuses: generationLinkStatuses,
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

        const now = new Date().toISOString();
        return {
          imageReport: imageReportNext,
          realismSave: await prepareArticleForDb({
            id: realismId,
            slug: realismSlug,
            articleJson: realismPack.article,
            mode: "realism",
            intake: realismPack.intakeForMode,
            headshotDataUrl: prepared.headshot,
            extraPhotoUrls: prepared.extraPhotos.map((p) => p.dataUrl),
            extractedFacts: extracted,
            alternateSlug: creativeSlug || undefined,
            createdAt: now,
            updatedAt: now,
          }),
          creativeSave:
            generateCreativeVersion && creativePack
              ? await prepareArticleForDb({
                  id: creativeId,
                  slug: creativeSlug,
                  articleJson: creativePack.article,
                  mode: "creative",
                  intake: creativePack.intakeForMode,
                  headshotDataUrl: prepared.headshot,
                  extraPhotoUrls: prepared.extraPhotos.map((p) => p.dataUrl),
                  extractedFacts: extracted,
                  alternateSlug: realismSlug,
                  createdAt: now,
                  updatedAt: now,
                })
              : null,
        };
      });

      const realismResult = await runStep(
        "save-realism",
        "Saving Realism article…",
        async () => {
          const result = await saveArticleToServer(realismSave, { isAdmin });
          if (!result.ok) throw new Error(result.error);
          return result;
        },
      );
      let creativeResult: typeof realismResult | null = null;
      if (creativeSave) {
        creativeResult = await runStep(
          "save-creative",
          "Saving Creative article…",
          async () => {
            const result = await saveArticleToServer(creativeSave, { isAdmin });
            if (!result.ok) throw new Error(result.error);
            return result;
          },
        );
      } else {
        setGenerationRun((r) =>
          r ? skipGenerationStep(r, "save-creative", "Realism only selected") : r,
        );
      }
      const saved =
        primaryMode === "creative" && creativeResult ? creativeResult : realismResult;

      if (signal.aborted) return;

      const finalRun = genRunRef.current;
      if (isAdmin && finalRun) {
        void fetch("/api/admin/generation-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: intakeFinal.mode,
            success: true,
            logs: finalRun.logs,
            steps: finalRun.steps,
            metrics: {
              imageReport,
              slug: saved.slug,
            },
          }),
        });
      }
      genRunRef.current = null;
      setGenerationRun(null);
      router.push(`/article?slug=${saved.slug}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      adminFailed = true;
      const msg = formatGenerationError(e);
      setError(msg);
      const currentRun = genRunRef.current;
      if (currentRun) {
        const active = currentRun.steps.find((s) => s.status === "active");
        const failed = active
          ? failGenerationStep(currentRun, active.id, e)
          : { ...currentRun, failed: true, errorMessage: msg };
        genRunRef.current = failed;
        if (isAdmin) {
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
        setGenerationRun(failed);
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      if (!adminFailed) {
        setGenPhase(null);
        setGenDetail("");
        setGenerationRun(null);
      }
    }
  };

  const saved = getSavedArticles();
  const hasUploads =
    headshot.length > 0 || screenshots.length > 0 || extraPhotos.length > 0;

  return (
    <div className="create-page">
      {genRun && (
        <GenerationProgress
          detail={genDetail}
          startedAt={genStartedAt}
          onCancel={genRun.failed ? undefined : cancelGeneration}
          canCancel={busy && !genRun.failed}
          steps={genRun.steps}
          logs={isAdmin ? genRun.logs : undefined}
          showAdminBadge={isAdmin}
          errorMessage={genRun.failed ? genRun.errorMessage : undefined}
          hasUploads={hasUploads}
          onDismiss={genRun.failed ? dismissGeneration : undefined}
        />
      )}

      <main className={`create-page-main safe-top ${busy ? "ui-busy" : ""}`}>
        <CreateArticleForm
          intake={intake}
          onIntakeChange={setIntake}
          headshot={headshot[0] ?? ""}
          onHeadshotChange={(url) => setHeadshot(url ? [url] : [])}
          screenshots={screenshots}
          onScreenshotsChange={setScreenshots}
          extraPhotos={extraPhotos}
          onExtraPhotosChange={setExtraPhotos}
          facts={linkFacts ?? facts}
          smartParsed={smartParsed}
          linkStatuses={linkStatuses}
          linkBusy={linkBusy}
          generateCreativeVersion={generateCreativeVersion}
          onGenerateCreativeVersionChange={(value) => {
            setGenerateCreativeVersion(value);
            if (!value && intake.mode === "creative") {
              setIntake((prev) => ({ ...prev, mode: "realism" }));
            }
          }}
          onAnalyzeSources={() => void extractLinkSources()}
          onApplySmartParsed={applySmartParsed}
          busy={busy}
          onGenerate={() => void generate()}
          onExtractScreenshots={() => void extractScreenshots()}
          generateError={error && !genRun ? error : undefined}
          onClearGenerateError={() => setError("")}
        />

        {saved.length > 0 && (
          <section className="create-page-saved">
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
