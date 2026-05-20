"use client";

import { useEffect, useState } from "react";
import type { GenerationLogEntry, GenerationRunStep } from "@/lib/generationRun";

export type GenerationPhase = "extract" | "generate" | "save";

const SIMPLE_STEPS: { id: GenerationPhase; label: string }[] = [
  { id: "extract", label: "Extract" },
  { id: "generate", label: "Generate" },
  { id: "save", label: "Save" },
];

function phaseIndex(phase: GenerationPhase): number {
  return SIMPLE_STEPS.findIndex((s) => s.id === phase);
}

function stepMarker(step: GenerationRunStep): string {
  if (step.status === "success") return "✓";
  if (step.status === "error") return "✕";
  if (step.status === "skipped") return "—";
  if (step.status === "active") return "…";
  return "○";
}

export function GenerationProgress({
  phase,
  detail,
  startedAt,
  onCancel,
  canCancel,
  adminSteps,
  adminLogs,
  adminError,
  onDismiss,
}: {
  phase?: GenerationPhase;
  detail?: string;
  startedAt: number;
  onCancel?: () => void;
  canCancel?: boolean;
  /** Admin testing: granular checklist */
  adminSteps?: GenerationRunStep[];
  adminLogs?: GenerationLogEntry[];
  adminError?: string;
  onDismiss?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const isAdminMode = Boolean(adminSteps?.length);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const current = phase ? phaseIndex(phase) : -1;
  const failed = Boolean(adminError || adminSteps?.some((s) => s.status === "error"));

  return (
    <div className="loading-overlay" role="alert" aria-live="polite" aria-busy={!failed}>
      <div
        className={`loading-overlay-card generation-progress-card ${isAdminMode ? "generation-progress-card--admin" : ""}`}
      >
        {isAdminMode ? (
          <>
            <p className="generation-admin-badge">Admin test mode</p>
            <ol className="generation-steps-admin">
              {adminSteps!.map((step) => (
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
            {detail && <p className="generation-progress-detail">{detail}</p>}
            {adminError && (
              <p className="generation-progress-failure" role="alert">
                {adminError}
              </p>
            )}
            {adminLogs && adminLogs.length > 0 && (
              <div className="generation-log-panel">
                <p className="generation-log-title">Run log</p>
                <ol className="generation-log-list">
                  {adminLogs.map((entry, i) => (
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
          </>
        ) : (
          <>
            <ol className="generation-steps">
              {SIMPLE_STEPS.map((step, i) => {
                const done = i < current;
                const active = i === current;
                return (
                  <li
                    key={step.id}
                    className={`generation-step ${done ? "generation-step--done" : ""} ${active ? "generation-step--active" : ""}`}
                  >
                    <span className="generation-step-marker" aria-hidden>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="generation-step-label">{step.label}</span>
                  </li>
                );
              })}
            </ol>
            {detail && <p className="generation-progress-detail">{detail}</p>}
            <p className="generation-progress-hint">
              This usually takes about 60 seconds. Please don&apos;t leave this page
              until generation finishes.
            </p>
          </>
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
