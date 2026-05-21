"use client";

import { useState } from "react";
import type { ArticleLength, IntakeData, TonePreference } from "@/types/article";
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
  CREATE_FORM_TABS,
  MORE_FIELDS,
  type CreateFormTabId,
} from "@/lib/createFormTabs";
import { TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/intakeFields";
import type { ExtraPhotoUpload } from "@/lib/extraPhotoUpload";

export function CreateArticleForm({
  intake,
  onIntakeChange,
  headshot,
  onHeadshotChange,
  screenshots,
  onScreenshotsChange,
  extraPhotos,
  onExtraPhotosChange,
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
  busy?: boolean;
  onGenerate: () => void;
  onExtractScreenshots?: () => void;
  generateError?: string;
  onClearGenerateError?: () => void;
}) {
  const [tab, setTab] = useState<CreateFormTabId>("basics");
  const creativeActive = intake.mode === "creative";
  const canGenerate =
    Boolean(intake.fullName.trim()) && Boolean(intake.articleTitle.trim());

  const tabNav = (position: "top" | "bottom") => (
    <nav
      className={`create-form-tabs create-form-tabs--${position}`}
      aria-label={
        position === "top" ? "Create article sections" : "Create article sections (bottom)"
      }
    >
      {CREATE_FORM_TABS.map((t) => {
        const isGenerate = t.id === "generate";
        return (
          <button
            key={`${position}-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`create-panel-${t.id}`}
            id={position === "top" ? `create-tab-${t.id}` : undefined}
            className={[
              "create-form-tab",
              tab === t.id && "create-form-tab--active",
              isGenerate && "create-form-tab--generate",
              isGenerate && creativeActive && "create-form-tab--generate-creative",
              isGenerate && !creativeActive && "create-form-tab--generate-realism",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTab(t.id)}
            disabled={busy}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div
      className={`create-article-form${creativeActive ? " intake-form--creative" : ""}`}
    >
      {tabNav("top")}

      <div className="create-form-panels">
        {tab === "basics" && (
          <section
            id="create-panel-basics"
            role="tabpanel"
            aria-labelledby="create-tab-basics"
            className="create-form-panel"
          >
            <h1 className="create-form-panel-title">Basics</h1>
            <p className="create-form-panel-sub">
              Choose realism or creative mode, then enter the name on your Wikipedia page.
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
            {tabNav("bottom")}
          </section>
        )}

        {tab === "uploads" && (
          <section
            id="create-panel-uploads"
            role="tabpanel"
            aria-labelledby="create-tab-uploads"
            className="create-form-panel"
          >
            <h1 className="create-form-panel-title">Uploads</h1>
            <p className="create-form-panel-sub">
              Headshot for the infobox, optional profile screenshots, and up to two extra
              article photos.
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
            {tabNav("bottom")}
          </section>
        )}

        {tab === "bio" && (
          <section
            id="create-panel-bio"
            role="tabpanel"
            aria-labelledby="create-tab-bio"
            className="create-form-panel"
          >
            <h1 className="create-form-panel-title">Bio</h1>
            <p className="create-form-panel-sub">
              Location, education, work, and life events — all optional but improve the article.
            </p>
            <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
              <IntakeFieldsGrid
                fields={BIO_FIELDS}
                value={intake}
                onChange={onIntakeChange}
              />
            </fieldset>
            {tabNav("bottom")}
          </section>
        )}

        {tab === "more" && (
          <section
            id="create-panel-more"
            role="tabpanel"
            aria-labelledby="create-tab-more"
            className="create-form-panel"
          >
            <h1 className="create-form-panel-title">More</h1>
            <p className="create-form-panel-sub">
              Achievements, controversies, pasted profile text, and anything else the AI should
              know.
            </p>
            <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
              <IntakeFieldsGrid
                fields={MORE_FIELDS}
                value={intake}
                onChange={onIntakeChange}
                columns={1}
              />
            </fieldset>
            {tabNav("bottom")}
          </section>
        )}

        {tab === "generate" && (
          <section
            id="create-panel-generate"
            role="tabpanel"
            aria-labelledby="create-tab-generate"
            className="create-form-panel"
          >
            <h1 className="create-form-panel-title">Generate</h1>
            <p className="create-form-panel-sub">
              Set tone and length, then create your article. Use the tabs above or below to
              edit anything first.
            </p>
            <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0 space-y-6">
              <dl className="create-form-summary">
                <div>
                  <dt>Mode</dt>
                  <dd>{intake.mode === "creative" ? "Creative" : "Realism"}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{intake.fullName.trim() || "—"}</dd>
                </div>
                <div>
                  <dt>Uploads</dt>
                  <dd>
                    {headshot ? "Headshot" : "No headshot"}
                    {screenshots.length > 0
                      ? ` · ${screenshots.length} screenshot(s)`
                      : ""}
                    {extraPhotos.length > 0
                      ? ` · ${extraPhotos.length} extra photo(s)`
                      : ""}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Tone</span>
                  <select
                    className="form-input mt-1 w-full"
                    name="tone"
                    value={intake.tone}
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
                  <span className="text-sm font-medium text-slate-700">Article length</span>
                  <select
                    className="form-input mt-1 w-full"
                    name="article-length"
                    value={intake.articleLength}
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

              {!canGenerate && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Add your full name and article title on the Basics tab before generating.
                </p>
              )}

              <LoadingButton
                loading={busy}
                loadingLabel="Generating…"
                onClick={() => {
                  onClearGenerateError?.();
                  onGenerate();
                }}
                disabled={busy || !canGenerate}
              >
                Generate article
              </LoadingButton>

              {generateError && !busy && (
                <div className="generate-error-banner" role="alert">
                  <p className="generate-error-text whitespace-pre-wrap">{generateError}</p>
                  <button
                    type="button"
                    className="btn-primary mt-3"
                    onClick={() => {
                      onClearGenerateError?.();
                      onGenerate();
                    }}
                  >
                    Retry generation
                  </button>
                </div>
              )}
            </fieldset>
            {tabNav("bottom")}
          </section>
        )}
      </div>
    </div>
  );
}
