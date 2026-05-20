"use client";

import type { GenerationRunRecord } from "@/lib/adminGenerationRuns";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminGenerationRuns({ runs }: { runs: GenerationRunRecord[] }) {
  if (!runs.length) {
    return (
      <p className="admin-muted">
        No generation runs logged yet. Run a create from /generate while signed in as admin.
      </p>
    );
  }

  return (
    <div className="admin-runs-list">
      {runs.map((run) => (
        <details key={run.id} className="admin-run-details">
          <summary className="admin-run-summary">
            <span
              className={`admin-run-status admin-run-status--${run.success ? "ok" : "fail"}`}
            >
              {run.success ? "OK" : "Failed"}
            </span>
            <span className="admin-run-meta">
              {formatWhen(run.createdAt)} · {run.mode} · {run.userEmail ?? "unknown"}
            </span>
            {run.metrics && (
              <span className="admin-run-metrics-preview">
                {typeof run.metrics.imageReport === "string"
                  ? run.metrics.imageReport
                  : ""}
              </span>
            )}
            {run.errorMessage && (
              <span className="admin-run-error-preview">{run.errorMessage}</span>
            )}
          </summary>

          {run.metrics && Object.keys(run.metrics).length > 0 && (
            <dl className="admin-run-metrics">
              {Object.entries(run.metrics).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {run.steps && run.steps.length > 0 && (
            <ol className="admin-run-steps">
              {run.steps.map((step) => (
                <li
                  key={step.id}
                  className={`admin-run-step admin-run-step--${step.status}`}
                >
                  {step.label}
                  {step.detail ? ` — ${step.detail}` : ""}
                  {step.error ? ` (${step.error})` : ""}
                </li>
              ))}
            </ol>
          )}

          {run.logs.length > 0 && (
            <ol className="admin-run-log">
              {run.logs.map((entry, i) => (
                <li
                  key={`${entry.at}-${i}`}
                  className={`admin-run-log-line admin-run-log-line--${entry.level}`}
                >
                  <time dateTime={entry.at}>{entry.at.slice(11, 19)}</time>
                  {entry.stepId && <code>{entry.stepId}</code>}
                  <span>{entry.message}</span>
                </li>
              ))}
            </ol>
          )}
        </details>
      ))}
    </div>
  );
}
