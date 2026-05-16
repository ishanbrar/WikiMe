"use client";

import type { IntakeData } from "@/types/article";
import { REVIEW_ROWS, displayValue } from "@/lib/intakeFields";
import { hapticTap } from "@/lib/haptics";
import { shouldSyncArticleTitle } from "@/lib/intakeSync";
import { IntakeRequiredNote } from "@/components/intake/IntakeRequiredNote";

export function IntakeReview({
  intake,
  onEditSlide,
  onChange,
  onContinue,
  disabled,
}: {
  intake: IntakeData;
  onEditSlide: (slideId: string) => void;
  onChange: (v: IntakeData) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const slideForKey: Record<string, string> = {
    fullName: "name",
    articleTitle: "title",
    currentLocation: "location",
    birthplace: "hometown",
    education: "education",
    occupation: "work",
    achievements: "achievements",
    lifeEvents: "life",
    skills: "extras",
    mode: "mode-confirm",
    tone: "style",
    articleLength: "style",
    pastedProfileText: "profile",
    extraNotes: "profile",
  };

  return (
    <div className="intake-review">
      <h1 className="intake-slide-title">Review your answers</h1>
      <p className="intake-slide-sub">
        Tap any row to edit. Then continue to photo uploads.
      </p>

      <IntakeRequiredNote className="mt-3 mb-1" />

      <ul className="intake-review-list">
        {REVIEW_ROWS.map((row) => {
          const display = displayValue(intake, row.key);
          const empty = display === "—";
          return (
            <li key={row.key}>
              <button
                type="button"
                className="intake-review-row"
                disabled={disabled}
                onClick={() => {
                  hapticTap();
                  const slideId = slideForKey[row.key];
                  if (slideId) onEditSlide(slideId);
                }}
              >
                <span className="intake-review-label">{row.label}</span>
                <span
                  className={`intake-review-value ${empty ? "intake-review-empty" : ""}`}
                >
                  {empty ? "Tap to add" : display}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {(!intake.fullName.trim() || !intake.articleTitle.trim()) && (
        <p className="text-red-600 text-sm mt-2" role="alert">
          Full name and article title are required before continuing.
        </p>
      )}

      <div className="intake-mobile-actions">
        <button
          type="button"
          className="btn-primary intake-mobile-btn"
          disabled={
            disabled || !intake.fullName.trim() || !intake.articleTitle.trim()
          }
          onClick={() => {
            hapticTap();
            if (shouldSyncArticleTitle(intake.articleTitle, intake.fullName)) {
              onChange({ ...intake, articleTitle: intake.fullName });
            }
            onContinue();
          }}
        >
          Continue to uploads
        </button>
      </div>
    </div>
  );
}
