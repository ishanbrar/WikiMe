"use client";

import { useEffect, useMemo, useState } from "react";
import type { GenerationLogEntry, GenerationRunStep } from "@/lib/generationRun";

function stepMarker(step: GenerationRunStep): string {
  if (step.status === "success") return "✓";
  if (step.status === "error") return "✕";
  if (step.status === "skipped") return "—";
  if (step.status === "active") return "…";
  return "○";
}

function stepProgressPercent(steps: GenerationRunStep[]): number {
  if (!steps.length) return 0;
  const done = steps.filter(
    (s) => s.status === "success" || s.status === "skipped",
  ).length;
  const active = steps.some((s) => s.status === "active") ? 0.5 : 0;
  return Math.min(100, Math.round(((done + active) / steps.length) * 100));
}

export function GenerationProgress({
  detail,
  startedAt,
  onCancel,
  canCancel,
  steps,
  logs,
  showAdminBadge,
  errorMessage,
  hasUploads = false,
  onDismiss,
}: {
  detail?: string;
  startedAt: number;
  onCancel?: () => void;
  canCancel?: boolean;
  steps?: GenerationRunStep[];
  logs?: GenerationLogEntry[];
  showAdminBadge?: boolean;
  errorMessage?: string;
  /** Headshot, screenshots, or extra photos — longer generation time */
  hasUploads?: boolean;
  onDismiss?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const failed = Boolean(
    errorMessage || steps?.some((s) => s.status === "error"),
  );
  const progressPct = useMemo(
    () => (steps?.length ? stepProgressPercent(steps) : 0),
    [steps],
  );
  const showSlowHint = !failed && elapsed >= 90;
  const showPhotoTimeHint = hasUploads && !failed && elapsed < 90;

  const primaryHint = hasUploads
    ? "Articles with photos or screenshots can take up to 2 minutes. Please keep this tab open until your article appears."
    : "This usually takes about 60 seconds. Please keep this tab open until generation finishes.";

  return (
    <div className="loading-overlay" role="alert" aria-live="polite" aria-busy={!failed}>
      <div
        className={`loading-overlay-card generation-progress-card ${showAdminBadge ? "generation-progress-card--admin" : ""}`}
      >
        <p className="generation-progress-title">Creating your article</p>

        {showAdminBadge && <p className="generation-admin-badge">Admin test mode</p>}

        {steps && steps.length > 0 && (
          <>
            <div
              className="generation-progress-bar"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Generation progress"
            >
              <div
                className="generation-progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="generation-progress-pct">{progressPct}% complete</p>

            <ol className="generation-steps-admin">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`generation-step-admin generation-step-admin--${step.status}`}
                >
                  <span className="generation-step-marker" aria-hidden>
                    {stepMarker(step)}
                  </span>
                  <div className="generation-step-admin-body">
                    <span className="generation-step-label">{step.label}</span>
                    {step.detail && step.status !== "error" && (
                      <span className="generation-step-sub">{step.detail}</span>
                    )}
                    {step.error && (
                      <span className="generation-step-error-text">{step.error}</span>
                    )}
                    {step.startedAt && step.endedAt && (
                      <span className="generation-step-sub">
                        {Math.round((step.endedAt - step.startedAt) / 1000)}s
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        {detail && <p className="generation-progress-detail">{detail}</p>}

        <p className="generation-progress-hint">{primaryHint}</p>

        {showPhotoTimeHint && (
          <p className="generation-progress-hint generation-progress-hint--photo">
            Uploads with pictures often need the full 2 minutes — we are still processing
            your images and writing the article.
          </p>
        )}

        {showSlowHint && (
          <p className="generation-progress-hint generation-progress-hint--warn">
            Still working — realism mode with lots of detail can take a few minutes. If
            this exceeds 5 minutes, cancel and try a shorter article length.
          </p>
        )}

        {errorMessage && (
          <p className="generation-progress-failure" role="alert">
            {errorMessage}
          </p>
        )}

        {showAdminBadge && logs && logs.length > 0 && (
          <div className="generation-log-panel">
            <p className="generation-log-title">Run log</p>
            <ol className="generation-log-list">
              {logs.map((entry, i) => (
                <li
                  key={`${entry.at}-${i}`}
                  className={`generation-log-line generation-log-line--${entry.level}`}
                >
                  <time dateTime={entry.at}>{entry.at.slice(11, 19)}</time>
                  {entry.stepId && (
                    <span className="generation-log-step">{entry.stepId}</span>
                  )}
                  <span>{entry.message}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="generation-progress-elapsed">{elapsed}s elapsed</p>

        {failed && onDismiss ? (
          <button type="button" className="btn-primary generation-dismiss" onClick={onDismiss}>
            Dismiss
          </button>
        ) : (
          canCancel &&
          onCancel && (
            <button type="button" className="btn-secondary generation-cancel" onClick={onCancel}>
              Cancel
            </button>
          )
        )}
      </div>
    </div>
  );
}
