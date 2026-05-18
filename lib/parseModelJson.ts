import { jsonrepair } from "jsonrepair";

/** Pull JSON object/array out of model output (markdown fences, leading prose). */
export function extractJsonFromModelText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const objStart = trimmed.indexOf("{");
  const arrStart = trimmed.indexOf("[");
  let start = -1;
  if (objStart === -1) start = arrStart;
  else if (arrStart === -1) start = objStart;
  else start = Math.min(objStart, arrStart);

  if (start === -1) return trimmed;
  return trimmed.slice(start);
}

export function parseJsonFromModel<T>(raw: string): T {
  const jsonStr = extractJsonFromModelText(raw);
  if (!jsonStr) {
    throw new Error("AI returned empty JSON.");
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (first) {
    try {
      return JSON.parse(jsonrepair(jsonStr)) as T;
    } catch {
      const detail =
        first instanceof Error ? first.message : "Invalid JSON from AI";
      throw new Error(
        `AI returned invalid JSON (${detail}). Try again or choose a shorter article length.`,
      );
    }
  }
}
