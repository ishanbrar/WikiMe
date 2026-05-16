"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createDefaultIntake } from "@/components/IntakeForm";
import { IntakeFlow } from "@/components/intake/IntakeFlow";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ScreenshotUploader } from "@/components/ScreenshotUploader";
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
import { saveArticleToServer } from "@/lib/saveArticleClient";
import { nanoid } from "nanoid";
import { LoadingButton } from "@/components/LoadingButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";

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
  const [facts, setFacts] = useState<ExtractedProfileFacts>(emptyExtractedFacts());
  const [busy, setBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = loadDraft<{
      intake: IntakeData;
      headshot: string[];
      screenshots: string[];
      facts: ExtractedProfileFacts;
    }>();
    if (draft?.intake) {
      setIntake(draft.intake);
      setFacts(normalizeExtractedFacts(draft.facts ?? emptyExtractedFacts()));
    }
  }, []);

  const persistDraft = useCallback(() => {
    // Omit image data from sessionStorage — large base64 strings exceed quota.
    saveDraft({ intake, facts, hasImages: headshot.length > 0 || screenshots.length > 0 });
  }, [intake, headshot, screenshots, facts]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const extractScreenshots = async (
    managed?: boolean,
  ): Promise<ExtractedProfileFacts> => {
    if (!screenshots.length) {
      const empty = emptyExtractedFacts();
      setFacts(empty);
      return empty;
    }
    const hashes = await Promise.all(screenshots.map(hashDataUrl));
    const cached = getCachedExtractedFacts(hashes);
    if (cached) {
      const c = normalizeExtractedFacts(cached);
      setFacts(c);
      return c;
    }
    if (!managed) {
      setBusy(true);
      setLoadingMessage("Extracting profile facts from screenshots…");
    } else {
      setLoadingMessage("Extracting profile facts from screenshots…");
    }
    setError("");
    try {
      let merged = emptyExtractedFacts();
      for (const shot of screenshots) {
        const res = await fetch("/api/extract-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshots: [shot] }),
        });
        const data = await parseJsonResponse<{
          facts?: unknown;
          error?: string;
        }>(res);
        if (!res.ok) throw new Error(data.error ?? "Extraction failed");
        merged = mergeExtractedFacts(
          merged,
          normalizeExtractedFacts(data.facts),
        );
      }
      setFacts(merged);
      cacheExtractedFacts(hashes, merged);
      return merged;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      setError(msg);
      throw e;
    } finally {
      if (!managed) {
        setBusy(false);
        setLoadingMessage("");
      }
    }
  };

  const generate = async () => {
    if (!intake.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const title = intake.articleTitle.trim() || intake.fullName;
    const intakeFinal = { ...intake, articleTitle: title };
    setBusy(true);
    setLoadingMessage("Generating your Wikipedia article…");
    setError("");
    try {
      let extracted = facts;
      if (screenshots.length > 0) {
        extracted = await extractScreenshots(true);
        setLoadingMessage("Generating your Wikipedia article…");
      }
      extracted = normalizeExtractedFacts(extracted);

      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: intakeFinal,
          facts: extracted,
        }),
      });
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
          detail ? `${data.error ?? "Generation failed"} — ${detail}` : (data.error ?? "Generation failed"),
        );
      }

      const article = data.article!;
      if (headshot[0]) {
        article.infobox.imageUrl = headshot[0];
      }

      const articleId = nanoid();
      const articleSlug = nanoid(10);
      const sessionPayload = {
        article,
        intake: intakeFinal,
        headshotDataUrl: headshot[0] ?? "",
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

      setLoadingMessage("Saving your article link…");
      const saved = await saveArticleToServer({
        id: articleId,
        slug: articleSlug,
        articleJson: article,
        mode: intakeFinal.mode,
        intake: intakeFinal,
        headshotDataUrl: headshot[0],
        extractedFacts: extracted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (!saved.ok) {
        throw new Error(saved.error);
      }

      router.push(`/article?slug=${saved.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const saved = getSavedArticles();
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-slate-50 ${isMobile ? "intake-mobile-page" : ""}`}>
      {busy && (
        <LoadingOverlay
          message={loadingMessage}
          subMessage="This may take a minute."
        />
      )}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center safe-top">
        <Link
          href="/"
          className={`font-bold text-slate-900 ${busy ? "pointer-events-none opacity-50" : ""}`}
          tabIndex={busy ? -1 : 0}
          aria-disabled={busy}
        >
          WikiMe
        </Link>
        <span className="text-sm text-slate-500">Step {step} of 3</span>
      </header>

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
            <ScreenshotUploader
              label="Headshot (for infobox)"
              variant="headshot"
              images={headshot}
              onChange={setHeadshot}
            />
            <div className="mt-8">
              <ScreenshotUploader
                label="Social profile screenshots"
                multiple
                images={screenshots}
                onChange={setScreenshots}
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
          <p className="mt-4 text-red-600 text-sm" role="alert">
            {error}
          </p>
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
