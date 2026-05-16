"use client";

import { useEffect, useState } from "react";

export type GenerationPhase = "extract" | "generate" | "save";

const STEPS: { id: GenerationPhase; label: string }[] = [
  { id: "extract", label: "Extract" },
  { id: "generate", label: "Generate" },
  { id: "save", label: "Save" },
];

function phaseIndex(phase: GenerationPhase): number {
  return STEPS.findIndex((s) => s.id === phase);
}

export function GenerationProgress({
  phase,
  detail,
  startedAt,
  onCancel,
  canCancel,
}: {
  phase: GenerationPhase;
  detail?: string;
  startedAt: number;
  onCancel?: () => void;
  canCancel?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const current = phaseIndex(phase);

  return (
    <div className="loading-overlay" role="alert" aria-live="polite" aria-busy>
      <div className="loading-overlay-card generation-progress-card">
        <ol className="generation-steps">
          {STEPS.map((step, i) => {
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
        <p className="generation-progress-elapsed">{elapsed}s elapsed</p>
        {canCancel && onCancel && (
          <button type="button" className="btn-secondary generation-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
