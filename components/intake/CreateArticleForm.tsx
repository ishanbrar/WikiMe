"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArticleLength, IntakeData, TonePreference } from "@/types/article";
import type { ExtractedProfileFacts } from "@/types/article";
import { ModeSelector } from "@/components/ModeSelector";
import { HeadshotUploader } from "@/components/HeadshotUploader";
import { ScreenshotUploader } from "@/components/ScreenshotUploader";
import { ExtraPhotosUploader } from "@/components/ExtraPhotosUploader";
import { LoadingButton } from "@/components/LoadingButton";
import { IntakeRequiredNote } from "@/components/intake/IntakeRequiredNote";
import { IntakeFieldsGrid } from "@/components/intake/IntakeFieldsGrid";
import {
  BASICS_FIELDS,
  BIO_FIELDS,
  SOCIAL_FIELDS,
  CREATE_FORM_SECTIONS,
  MORE_FIELDS,
  createSectionProgress,
  type CreateFormSectionId,
} from "@/lib/createFormTabs";
import { TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/intakeFields";
import type { ExtraPhotoUpload } from "@/lib/extraPhotoUpload";
import type { IntakeSmartParse } from "@/lib/smartParseIntake";
import type { LinkExtractionStatus } from "@/lib/linkExtraction";
import { SourcePreview } from "@/components/intake/SourcePreview";
import { hapticGenerate } from "@/lib/haptics";

function sectionDomId(id: CreateFormSectionId): string {
  return `create-section-${id}`;
}

export function CreateArticleForm({
  intake,
  onIntakeChange,
  headshot,
  onHeadshotChange,
  screenshots,
  onScreenshotsChange,
  extraPhotos,
  onExtraPhotosChange,
  facts,
  smartParsed,
  linkStatuses,
  linkBusy,
  generateCreativeVersion,
  onGenerateCreativeVersionChange,
  onAnalyzeSources,
  onApplySmartParsed,
  busy,
  onGenerate,
  onExtractScreenshots,
  generateError,
  onClearGenerateError,
}: {
  intake: IntakeData;
  onIntakeChange: (v: IntakeData) => void;
  headshot: string;
  onHeadshotChange: (url: string) => void;
  screenshots: string[];
  onScreenshotsChange: (urls: string[]) => void;
  extraPhotos: ExtraPhotoUpload[];
  onExtraPhotosChange: (photos: ExtraPhotoUpload[]) => void;
  facts?: ExtractedProfileFacts | null;
  smartParsed: IntakeSmartParse;
  linkStatuses: LinkExtractionStatus[];
  linkBusy: boolean;
  generateCreativeVersion: boolean;
  onGenerateCreativeVersionChange: (value: boolean) => void;
  onAnalyzeSources: () => void;
  onApplySmartParsed: () => void;
  busy?: boolean;
  onGenerate: () => void;
  onExtractScreenshots?: () => void;
  generateError?: string;
  onClearGenerateError?: () => void;
}) {
  const creativeActive = intake.mode === "creative";
  const canGenerate =
    Boolean(intake.fullName.trim()) && Boolean(intake.articleTitle.trim());

  const progress = useMemo(
    () =>
      createSectionProgress(intake, {
        headshot,
        screenshots,
        extraPhotos,
      }),
    [intake, headshot, screenshots, extraPhotos],
  );

  const [activeSection, setActiveSection] =
    useState<CreateFormSectionId>("basics");
  const sectionRefs = useRef<Partial<Record<CreateFormSectionId, HTMLElement>>>(
    {},
  );

  const scrollToSection = useCallback((id: CreateFormSectionId) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveSection(id);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const id = visible[0].target.id.replace("create-section-", "") as CreateFormSectionId;
        if (CREATE_FORM_SECTIONS.some((s) => s.id === id)) {
          setActiveSection(id);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0, 0.15, 0.35],
      },
    );

    for (const s of CREATE_FORM_SECTIONS) {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const registerSection = useCallback(
    (id: CreateFormSectionId) => (el: HTMLElement | null) => {
      if (el) sectionRefs.current[id] = el;
    },
    [],
  );

  const summaryTitle =
    intake.articleTitle.trim() || intake.fullName.trim() || "Your article";
  const summaryMode = intake.mode === "creative" ? "Creative" : "Realism";

  return (
    <div
      className={`create-flow${creativeActive ? " create-flow--creative" : ""}`}
    >
      <header className="create-flow-header">
        <nav
          className="create-progress"
          aria-label="Create article progress"
        >
          {CREATE_FORM_SECTIONS.map((section, index) => {
            const done = progress[section.id];
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                className={[
                  "create-progress-step",
                  done && "create-progress-step--done",
                  active && "create-progress-step--active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={active ? "step" : undefined}
                aria-label={`${section.label}${done ? ", completed" : ""}`}
                disabled={busy}
                onClick={() => scrollToSection(section.id)}
              >
                <span className="create-progress-marker" aria-hidden>
                  {done ? (
                    <svg
                      className="create-progress-check"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="create-progress-index">{index + 1}</span>
                  )}
                </span>
                <span className="create-progress-label">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </header>
      <div className="create-flow-header-spacer" aria-hidden />

      <div className="create-flow-scroll">
        <section
          id={sectionDomId("basics")}
          ref={registerSection("basics")}
          className="create-flow-section"
        >
          <h2 className="create-flow-section-title">Basics</h2>
          <p className="create-flow-section-sub">
            Choose realism or creative mode, then enter the name on your
            Wikipedia page.
          </p>
          <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0 space-y-6">
            <ModeSelector
              value={intake.mode}
              onChange={(m) => onIntakeChange({ ...intake, mode: m })}
            />
            <IntakeRequiredNote />
            <IntakeFieldsGrid
              fields={BASICS_FIELDS}
              value={intake}
              onChange={onIntakeChange}
            />
          </fieldset>
        </section>

        <section
          id={sectionDomId("uploads")}
          ref={registerSection("uploads")}
          className="create-flow-section"
        >
          <h2 className="create-flow-section-title">Uploads</h2>
          <p className="create-flow-section-sub">
            Headshot for the infobox, optional profile screenshots, and up to
            two extra article photos.
          </p>
          <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
            <HeadshotUploader
              label="Headshot (for infobox)"
              image={headshot}
              subjectName={intake.fullName || intake.articleTitle}
              onChange={onHeadshotChange}
              disabled={busy}
            />
            <div className="mt-8">
              <ScreenshotUploader
                label="Social profile screenshots"
                multiple
                images={screenshots}
                onChange={onScreenshotsChange}
              />
            </div>
            <div className="mt-8">
              <ExtraPhotosUploader
                photos={extraPhotos}
                onChange={onExtraPhotosChange}
                disabled={busy}
              />
            </div>
            {screenshots.length > 0 && onExtractScreenshots && (
              <LoadingButton
                className="btn-secondary mt-4"
                loading={busy}
                loadingLabel="Extracting…"
                onClick={() => void onExtractScreenshots()}
                disabled={busy}
              >
                Preview extract from screenshots
              </LoadingButton>
            )}
          </fieldset>
        </section>

        <section
          id={sectionDomId("bio")}
          ref={registerSection("bio")}
          className="create-flow-section"
        >
          <h2 className="create-flow-section-title">Bio</h2>
          <p className="create-flow-section-sub">
            Location, education, work, and life events — all optional but improve
            the article.
          </p>
          <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
            <IntakeFieldsGrid
              fields={BIO_FIELDS}
              value={intake}
              onChange={onIntakeChange}
            />
            <div className="create-social-block">
              <h3 className="create-social-heading">Social profiles</h3>
              <p className="create-social-sub">
                Optional — links appear at the bottom of your article infobox with
                Instagram, LinkedIn, and X icons.
              </p>
              <IntakeFieldsGrid
                fields={SOCIAL_FIELDS}
                value={intake}
                onChange={onIntakeChange}
                columns={1}
              />
            </div>
          </fieldset>
        </section>

        <section
          id={sectionDomId("more")}
          ref={registerSection("more")}
          className="create-flow-section"
        >
          <h2 className="create-flow-section-title">More</h2>
          <p className="create-flow-section-sub">
            Put everything in <strong>Additional info</strong> if you like — the
            AI will sort it into the right sections. Or use the optional fields
            below for labeled details.
          </p>
          <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
            <IntakeFieldsGrid
              fields={MORE_FIELDS}
              value={intake}
              onChange={onIntakeChange}
              columns={1}
            />
          </fieldset>
          <SourcePreview
            intake={intake}
            parsed={smartParsed}
            facts={facts}
            linkStatuses={linkStatuses}
            linkBusy={linkBusy}
            onAnalyzeSources={onAnalyzeSources}
            onApplyParsed={onApplySmartParsed}
          />
        </section>

        <section
          id={sectionDomId("style")}
          ref={registerSection("style")}
          className="create-flow-section create-flow-section--last"
        >
          <h2 className="create-flow-section-title">Style</h2>
          <p className="create-flow-section-sub">
            Tone and length for both Realism and Creative versions of your
            article.
          </p>
          <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
            <div className="generate-scope" role="group" aria-label="Generation scope">
              <button
                type="button"
                className={[
                  "generate-scope-option",
                  !generateCreativeVersion && "generate-scope-option--active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onGenerateCreativeVersionChange(false)}
              >
                Realism only
              </button>
              <button
                type="button"
                className={[
                  "generate-scope-option",
                  generateCreativeVersion && "generate-scope-option--active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onGenerateCreativeVersionChange(true)}
              >
                Realism + Creative
              </button>
            </div>
            <div className="create-style-grid">
              <label className="block">
                <span className="create-style-label">Tone</span>
                <select
                  className="form-input mt-1 w-full"
                  name="tone"
                  value={intake.tone}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (
                        e.currentTarget
                          .closest(".create-style-grid")
                          ?.querySelector<HTMLSelectElement>(
                            'select[name="article-length"]',
                          ) ?? null
                      )?.focus();
                    }
                  }}
                  onChange={(e) =>
                    onIntakeChange({
                      ...intake,
                      tone: e.target.value as TonePreference,
                    })
                  }
                >
                  {TONE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="create-style-label">Article length</span>
                <select
                  className="form-input mt-1 w-full"
                  name="article-length"
                  value={intake.articleLength}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document
                        .querySelector<HTMLButtonElement>(
                          ".create-flow-generate-btn:not(:disabled)",
                        )
                        ?.focus();
                    }
                  }}
                  onChange={(e) =>
                    onIntakeChange({
                      ...intake,
                      articleLength: e.target.value as ArticleLength,
                    })
                  }
                >
                  {LENGTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        </section>

        {generateError && !busy && (
          <div className="create-flow-error" role="alert">
            <p className="generate-error-text whitespace-pre-wrap">
              {generateError}
            </p>
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={() => {
                onClearGenerateError?.();
                onGenerate();
              }}
            >
              Retry generation
            </button>
          </div>
        )}
      </div>

      <footer className="create-flow-bar">
        <div className="create-flow-bar-inner">
          <div className="create-flow-bar-summary">
            <p className="create-flow-bar-title">{summaryTitle}</p>
            <p className="create-flow-bar-meta">
              {summaryMode}
              {!generateCreativeVersion && " · Realism only"}
              {!canGenerate && (
                <span className="create-flow-bar-hint">
                  {" "}
                  · Add name &amp; title in Basics
                </span>
              )}
            </p>
          </div>
          <LoadingButton
            className={[
              "create-flow-generate-btn",
              creativeActive
                ? "create-flow-generate-btn--creative"
                : "create-flow-generate-btn--realism",
            ].join(" ")}
            loading={busy}
            loadingLabel="Generating…"
            onClick={() => {
              hapticGenerate();
              onClearGenerateError?.();
              onGenerate();
            }}
            disabled={busy || !canGenerate}
          >
            Generate
          </LoadingButton>
        </div>
      </footer>
    </div>
  );
}
