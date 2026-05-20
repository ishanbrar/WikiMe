import type { GenerationLogEntry, GenerationRunStep } from "@/lib/generationRun";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export type GenerationRunRecord = {
  id: string;
  createdAt: string;
  userEmail: string | null;
  mode: string;
  success: boolean;
  errorMessage: string | null;
  logs: GenerationLogEntry[];
  steps: GenerationRunStep[] | null;
  metrics: Record<string, unknown> | null;
};

export type SaveGenerationRunInput = {
  id?: string;
  userEmail?: string | null;
  mode: string;
  success: boolean;
  errorMessage?: string | null;
  logs: GenerationLogEntry[];
  steps?: GenerationRunStep[];
  metrics?: Record<string, unknown>;
};

export async function saveAdminGenerationRun(
  input: SaveGenerationRunInput,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const id = input.id ?? crypto.randomUUID();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("generation_runs").insert({
    id,
    user_email: input.userEmail ?? null,
    mode: input.mode,
    success: input.success,
    error_message: input.errorMessage ?? null,
    logs: input.logs,
    steps: input.steps ?? null,
    metrics: input.metrics ?? null,
  });

  if (error) {
    console.error("[WikiMe] save generation run:", error.message);
    return null;
  }
  return id;
}

export async function listAdminGenerationRuns(
  limit = 40,
): Promise<GenerationRunRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("generation_runs")
    .select(
      "id, created_at, user_email, mode, success, error_message, logs, steps, metrics",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    userEmail: (row.user_email as string | null) ?? null,
    mode: row.mode as string,
    success: Boolean(row.success),
    errorMessage: (row.error_message as string | null) ?? null,
    logs: (row.logs as GenerationLogEntry[]) ?? [],
    steps: (row.steps as GenerationRunStep[] | null) ?? null,
    metrics: (row.metrics as Record<string, unknown> | null) ?? null,
  }));
}
