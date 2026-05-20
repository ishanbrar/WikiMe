import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

/** Default weekly cap for GEMINI_API_KEY backup usage (USD). */
export const DEFAULT_GEMINI_FALLBACK_WEEKLY_BUDGET_USD = 0.5;

/** Gemini 2.0 Flash list pricing (USD per 1M tokens). */
const FLASH_INPUT_USD_PER_M = 0.1;
const FLASH_OUTPUT_USD_PER_M = 0.4;

/** Conservative pre-check reserve so concurrent calls stay near the cap. */
const PRECHECK_RESERVE_USD = 0.05;

export class GeminiFallbackBudgetError extends Error {
  constructor(
    message = "Gemini backup weekly limit ($0.50) reached. Try again next week, or retry when OpenRouter is available.",
  ) {
    super(message);
    this.name = "GeminiFallbackBudgetError";
  }
}

export function getGeminiFallbackWeeklyBudgetUsd(): number {
  const raw = process.env.GEMINI_FALLBACK_WEEKLY_BUDGET_USD;
  if (raw === undefined || raw === "") return DEFAULT_GEMINI_FALLBACK_WEEKLY_BUDGET_USD;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GEMINI_FALLBACK_WEEKLY_BUDGET_USD;
}

export function isGeminiFallbackBudgetDisabled(): boolean {
  return process.env.GEMINI_FALLBACK_BUDGET_DISABLED === "1";
}

/** UTC calendar week starting Monday (YYYY-MM-DD). */
export function getUtcWeekStartDate(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday),
  );
  return monday.toISOString().slice(0, 10);
}

export function estimateGeminiFlashCostUsd(
  inputTokens: number,
  outputTokens: number,
): number {
  const input = Math.max(0, inputTokens);
  const output = Math.max(0, outputTokens);
  return (
    (input / 1_000_000) * FLASH_INPUT_USD_PER_M +
    (output / 1_000_000) * FLASH_OUTPUT_USD_PER_M
  );
}

export type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export function costFromGeminiUsage(
  usage?: GeminiUsageMetadata | null,
  fallbackOutputTokens = 2048,
): number {
  const input = usage?.promptTokenCount ?? 0;
  let output = usage?.candidatesTokenCount ?? 0;
  if (output === 0 && usage?.totalTokenCount && usage.totalTokenCount > input) {
    output = usage.totalTokenCount - input;
  }
  if (input === 0 && output === 0) {
    return estimateGeminiFlashCostUsd(4000, fallbackOutputTokens);
  }
  return estimateGeminiFlashCostUsd(input, output);
}

function budgetTrackingRequired(): boolean {
  if (isGeminiFallbackBudgetDisabled()) return false;
  return process.env.NODE_ENV === "production" || isSupabaseConfigured();
}

/** Block backup Gemini calls when the weekly cap is exhausted. */
export async function assertGeminiFallbackBudgetAvailable(): Promise<void> {
  if (!budgetTrackingRequired()) return;

  if (!isSupabaseConfigured()) {
    throw new GeminiFallbackBudgetError(
      "Gemini backup is unavailable without Supabase (required for weekly spend limits).",
    );
  }

  const weekStart = getUtcWeekStartDate();
  const limit = getGeminiFallbackWeeklyBudgetUsd();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("can_use_gemini_fallback", {
    p_week_start: weekStart,
    p_reserved_cost_usd: PRECHECK_RESERVE_USD,
    p_weekly_limit_usd: limit,
  });

  if (error) {
    console.error("[WikiMe] gemini fallback budget check failed:", error.message);
    throw new GeminiFallbackBudgetError(
      "Could not verify Gemini backup budget. Try again shortly.",
    );
  }

  if (data !== true) {
    throw new GeminiFallbackBudgetError(
      `Gemini backup weekly limit ($${limit.toFixed(2)}) reached. Try again next week, or retry when OpenRouter is available.`,
    );
  }
}

/** Record actual spend after a successful direct Gemini API response. */
export async function recordGeminiFallbackUsage(
  usage?: GeminiUsageMetadata | null,
  fallbackOutputTokens = 2048,
): Promise<void> {
  if (!budgetTrackingRequired() || !isSupabaseConfigured()) return;

  const cost = costFromGeminiUsage(usage, fallbackOutputTokens);
  const inputTokens = usage?.promptTokenCount ?? 0;
  let outputTokens = usage?.candidatesTokenCount ?? 0;
  if (
    outputTokens === 0 &&
    usage?.totalTokenCount &&
    usage.totalTokenCount > inputTokens
  ) {
    outputTokens = usage.totalTokenCount - inputTokens;
  }

  const weekStart = getUtcWeekStartDate();
  const limit = getGeminiFallbackWeeklyBudgetUsd();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("record_gemini_fallback_usage", {
    p_week_start: weekStart,
    p_cost_usd: cost,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
    p_weekly_limit_usd: limit,
  });

  if (error) {
    console.error("[WikiMe] gemini fallback usage record failed:", error.message);
    return;
  }

  const result = data as { recorded?: boolean; spent_usd?: number } | null;
  if (result?.recorded === false) {
    console.warn(
      `[WikiMe] gemini fallback exceeded weekly cap after call (spent ~$${result.spent_usd ?? "?"}, limit $${limit})`,
    );
  }
}
