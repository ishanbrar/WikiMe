import type { Dispatch, SetStateAction } from "react";
import {
  completeGenerationStep,
  failGenerationStep,
  startGenerationStep,
  type GenerationRunState,
} from "@/lib/generationRun";

export async function runGenerationStep<T>(
  setRun: Dispatch<SetStateAction<GenerationRunState | null>>,
  stepId: string,
  fn: () => Promise<T>,
  detail?: string,
): Promise<T> {
  setRun((r) => (r ? startGenerationStep(r, stepId, detail) : r));
  try {
    const result = await fn();
    setRun((r) => (r ? completeGenerationStep(r, stepId) : r));
    return result;
  } catch (e) {
    setRun((r) => (r ? failGenerationStep(r, stepId, e) : r));
    throw e;
  }
}
