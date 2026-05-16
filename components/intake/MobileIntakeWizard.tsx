"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IntakeData } from "@/types/article";
import {
  INTAKE_SLIDES,
  LENGTH_OPTIONS,
  TONE_OPTIONS,
  type IntakeSlide,
} from "@/lib/intakeFields";
import { IntakeFieldControl } from "@/components/intake/IntakeFieldControl";
import { IntakeReview } from "@/components/intake/IntakeReview";
import { ModeSelector } from "@/components/ModeSelector";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { shouldSyncArticleTitle } from "@/lib/intakeSync";

type Phase = "slides" | "review";

export function MobileIntakeWizard({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: IntakeData;
  onChange: (v: IntakeData) => void;
  onComplete: () => void;
  disabled?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("slides");
  const [index, setIndex] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const slides = INTAKE_SLIDES;
  const slide = slides[index];
  const progress = phase === "review" ? 100 : ((index + 1) / slides.length) * 100;

  const goToSlide = useCallback((slideId: string) => {
    const i = slides.findIndex((s) => s.id === slideId);
    if (i >= 0) {
      setIndex(i);
      setPhase("slides");
    }
  }, [slides]);

  useEffect(() => {
    if (phase !== "slides") return;
    const t = window.setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>(
        "input, textarea, select",
      );
      el?.focus();
    }, 280);
    return () => window.clearTimeout(t);
  }, [index, phase]);

  const slideOptional = (s: IntakeSlide): boolean => {
    if (s.type !== "fields") return false;
    return s.fields.every((f) => f.optional);
  };

  const canProceed = (): boolean => {
    if (!slide || slide.type !== "fields") return true;
    for (const f of slide.fields) {
      if (f.required && !String(value[f.key] ?? "").trim()) return false;
    }
    return true;
  };

  const next = () => {
    hapticTap();
    if (slide?.type === "fields") {
      const hasName = slide.fields.some((f) => f.key === "fullName");
      if (
        hasName &&
        value.fullName.trim() &&
        shouldSyncArticleTitle(value.articleTitle, value.fullName)
      ) {
        onChange({ ...value, articleTitle: value.fullName });
      }
    }
    if (!canProceed()) {
      hapticError();
      return;
    }
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      hapticSuccess();
      setPhase("review");
    }
  };

  const back = () => {
    hapticTap();
    if (phase === "review") {
      setPhase("slides");
      setIndex(slides.length - 1);
      return;
    }
    if (index > 0) setIndex(index - 1);
  };

  const skip = () => {
    hapticTap();
    if (index < slides.length - 1) setIndex(index + 1);
    else setPhase("review");
  };

  return (
    <div className="intake-mobile">
      <div className="intake-progress-track" aria-hidden>
        <div
          className="intake-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {phase === "review" ? (
        <>
          <IntakeReview
            intake={value}
            onChange={onChange}
            onEditSlide={goToSlide}
            onContinue={onComplete}
            disabled={disabled}
          />
          <div className="intake-mobile-actions px-4 pb-safe">
            <button
              type="button"
              className="btn-secondary intake-mobile-btn w-full"
              onClick={back}
              disabled={disabled}
            >
              Back to questions
            </button>
          </div>
        </>
      ) : (
        <form
          ref={formRef}
          className={`intake-slide-form${value.mode === "creative" ? " intake-form--creative" : ""}`}
          autoComplete="on"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <p className="intake-step-count">
            {index + 1} of {slides.length}
          </p>

          <div key={slide.id} className="intake-slide-panel">
            <h1 className="intake-slide-title">{slide.title}</h1>
            {"subtitle" in slide && slide.subtitle && (
              <p className="intake-slide-sub">{slide.subtitle}</p>
            )}

            {slide.type === "fields" &&
              slide.fields.map((f) => (
                <div key={f.key} className="mt-4">
                  {slide.fields.length > 1 && (
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {f.label}
                    </p>
                  )}
                  <IntakeFieldControl
                    field={f}
                    value={value}
                    onChange={onChange}
                    autoFocus={slide.fields[0] === f}
                  />
                </div>
              ))}

            {slide.type === "mode" && (
              <ModeSelector
                value={value.mode}
                onChange={(m) => onChange({ ...value, mode: m })}
              />
            )}

            {slide.type === "tone-length" && (
              <div className="space-y-4 mt-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Tone</span>
                  <select
                    className="intake-mobile-input mt-1"
                    value={value.tone}
                    autoComplete="off"
                    onChange={(e) =>
                      onChange({
                        ...value,
                        tone: e.target.value as IntakeData["tone"],
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
                  <span className="text-sm font-medium text-slate-700">
                    Article length
                  </span>
                  <select
                    className="intake-mobile-input mt-1"
                    value={value.articleLength}
                    autoComplete="off"
                    onChange={(e) =>
                      onChange({
                        ...value,
                        articleLength: e.target
                          .value as IntakeData["articleLength"],
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
            )}
          </div>

          <div className="intake-mobile-actions">
            <div className="flex gap-2 w-full">
              <button
                type="button"
                className="btn-secondary intake-mobile-btn flex-1"
                onClick={back}
                disabled={disabled || index === 0}
              >
                Back
              </button>
              {slideOptional(slide) && (
                <button
                  type="button"
                  className="btn-secondary intake-mobile-btn flex-1"
                  onClick={skip}
                  disabled={disabled}
                >
                  Skip
                </button>
              )}
              <button
                type="submit"
                className="btn-primary intake-mobile-btn flex-[2]"
                disabled={disabled}
              >
                {index < slides.length - 1 ? "Next" : "Review"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
