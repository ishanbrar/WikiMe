"use client";

import { useEffect, useMemo, useState } from "react";
import type { GenerationLogEntry, GenerationRunStep } from "@/lib/generationRun";
import { formatUnknownError } from "@/lib/formatError";

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
  errorMessage?: string | unknown;
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

  const hasErrorMessage =
    typeof errorMessage === "string"
      ? errorMessage.trim().length > 0
      : errorMessage != null;
  const errorText = hasErrorMessage ? formatUnknownError(errorMessage) : "";
  const stepFailed = steps?.some((s) => s.status === "error") ?? false;
  const failed = stepFailed || Boolean(errorText);
  const progressPct = useMemo(
    () => (steps?.length ? stepProgressPercent(steps) : 0),
    [steps],
  );
  const showSlowHint = !failed && elapsed >= 90;
  const showPhotoTimeHint = hasUploads && !failed && elapsed < 90;

  const activeStep = steps?.find((s) => s.status === "active");
  const activeStepDetail = activeStep?.detail?.trim();
  const showDetail =
    Boolean(detail?.trim()) &&
    detail!.trim() !== activeStepDetail;

  const primaryHint = hasUploads
    ? "Photos can take up to 2 minutes. Keep this tab open."
    : "Usually about 60 seconds. Keep this tab open.";

  const statusLine =
    activeStepDetail ||
    detail?.trim() ||
    (failed ? "Something went wrong" : "Working on your article…");

  return (
    <div className="loading-overlay" role="alert" aria-live="polite" aria-busy={!failed}>
      <div
        className={`loading-overlay-card generation-progress-card ${showAdminBadge ? "generation-progress-card--admin" : ""}`}
      >
        <div className="generation-progress-hero">
          <div className="generation-loader" aria-hidden>
            {!failed && <span className="generation-loader-ring" />}
          </div>
          <div className="generation-progress-hero-text">
            <p className="generation-progress-title">Creating your article</p>
            {!failed && (
              <p className="generation-progress-status">{statusLine}</p>
            )}
          </div>
        </div>

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
              {!failed && <span className="generation-progress-bar-shimmer" aria-hidden />}
            </div>
            <p className="generation-progress-pct">{progressPct}%</p>

            <ol className="generation-steps-compact" aria-label="Generation steps">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`generation-step-pill generation-step-pill--${step.status}`}
                  title={step.label}
                >
                  <span className="generation-step-pill-marker" aria-hidden>
                    {stepMarker(step)}
                  </span>
                  <span className="generation-step-pill-label">{step.label}</span>
                </li>
              ))}
            </ol>

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
                      <span className="generation-step-error-text">
                        {formatUnknownError(step.error)}
                      </span>
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

        {showDetail && (
          <p className="generation-progress-detail generation-progress-detail--extra">
            {detail}
          </p>
        )}

        {!failed && (
          <p className="generation-progress-hint">{primaryHint}</p>
        )}

        {showPhotoTimeHint && (
          <p className="generation-progress-hint generation-progress-hint--photo">
            Still processing uploads and writing your article.
          </p>
        )}

        {showSlowHint && (
          <p className="generation-progress-hint generation-progress-hint--warn">
            Still working — try a shorter length if this exceeds 5 minutes.
          </p>
        )}

        {errorText && (
          <p className="generation-progress-failure" role="alert">
            {errorText}
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

        <p className="generation-progress-elapsed">{elapsed}s</p>

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
