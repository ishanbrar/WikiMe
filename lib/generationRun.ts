export type GenerationStepStatus =
  | "pending"
  | "active"
  | "success"
  | "error"
  | "skipped";

export type GenerationLogLevel = "info" | "warn" | "error";

export type GenerationRunStep = {
  id: string;
  label: string;
  status: GenerationStepStatus;
  detail?: string;
  error?: string;
  startedAt?: number;
  endedAt?: number;
};

export type GenerationLogEntry = {
  at: string;
  level: GenerationLogLevel;
  stepId?: string;
  message: string;
};

export type GenerationRunState = {
  startedAt: number;
  steps: GenerationRunStep[];
  logs: GenerationLogEntry[];
  failed: boolean;
  errorMessage?: string;
};

export function buildGenerationPlan(screenshotCount: number): GenerationRunStep[] {
  const steps: GenerationRunStep[] = [
    { id: "prepare-images", label: "Optimize images", status: "pending" },
  ];
  for (let i = 0; i < screenshotCount; i++) {
    steps.push({
      id: `extract-${i}`,
      label:
        screenshotCount === 1
          ? "Extract profile from screenshot"
          : `Extract screenshot ${i + 1} of ${screenshotCount}`,
      status: "pending",
    });
  }
  steps.push(
    { id: "generate", label: "Generate Wikipedia article (AI)", status: "pending" },
    { id: "save", label: "Save article to server", status: "pending" },
  );
  return steps;
}

export function createGenerationRun(screenshotCount: number): GenerationRunState {
  return {
    startedAt: Date.now(),
    steps: buildGenerationPlan(screenshotCount),
    logs: [],
    failed: false,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export function appendGenerationLog(
  run: GenerationRunState,
  level: GenerationLogLevel,
  message: string,
  stepId?: string,
): GenerationRunState {
  const entry: GenerationLogEntry = { at: nowIso(), level, message, stepId };
  if (typeof console !== "undefined" && level === "error") {
    console.error("[WikiMe generate]", stepId ?? "run", message);
  } else if (typeof console !== "undefined" && level === "warn") {
    console.warn("[WikiMe generate]", stepId ?? "run", message);
  } else if (typeof console !== "undefined") {
    console.info("[WikiMe generate]", stepId ?? "run", message);
  }
  return { ...run, logs: [...run.logs, entry] };
}

export function startGenerationStep(
  run: GenerationRunState,
  stepId: string,
  detail?: string,
): GenerationRunState {
  let r = appendGenerationLog(run, "info", detail ?? `Started: ${stepLabel(run, stepId)}`, stepId);
  return {
    ...r,
    steps: r.steps.map((s) =>
      s.id === stepId
        ? { ...s, status: "active", detail, startedAt: Date.now(), error: undefined }
        : s,
    ),
  };
}

export function completeGenerationStep(
  run: GenerationRunState,
  stepId: string,
  detail?: string,
): GenerationRunState {
  let r = appendGenerationLog(
    run,
    "info",
    detail ?? `Completed: ${stepLabel(run, stepId)}`,
    stepId,
  );
  return {
    ...r,
    steps: r.steps.map((s) =>
      s.id === stepId
        ? {
            ...s,
            status: "success",
            detail: detail ?? s.detail,
            endedAt: Date.now(),
            error: undefined,
          }
        : s,
    ),
  };
}

export function skipGenerationStep(
  run: GenerationRunState,
  stepId: string,
  reason?: string,
): GenerationRunState {
  let r = appendGenerationLog(
    run,
    "info",
    reason ?? `Skipped: ${stepLabel(run, stepId)}`,
    stepId,
  );
  return {
    ...r,
    steps: r.steps.map((s) =>
      s.id === stepId ? { ...s, status: "skipped", detail: reason, endedAt: Date.now() } : s,
    ),
  };
}

export function failGenerationStep(
  run: GenerationRunState,
  stepId: string,
  err: unknown,
): GenerationRunState {
  const message = formatGenerationError(err);
  let r = appendGenerationLog(run, "error", message, stepId);
  return {
    ...r,
    failed: true,
    errorMessage: message,
    steps: r.steps.map((s) =>
      s.id === stepId
        ? {
            ...s,
            status: "error",
            error: message,
            detail: message,
            endedAt: Date.now(),
          }
        : s,
    ),
  };
}

export function mergeServerAdminLog(
  run: GenerationRunState,
  lines: string[] | undefined,
  stepId?: string,
): GenerationRunState {
  if (!lines?.length) return run;
  let r = run;
  for (const line of lines) {
    r = appendGenerationLog(r, "info", `[server] ${line}`, stepId);
  }
  return r;
}

function stepLabel(run: GenerationRunState, stepId: string): string {
  return run.steps.find((s) => s.id === stepId)?.label ?? stepId;
}

export function formatGenerationError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Cancelled";
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
