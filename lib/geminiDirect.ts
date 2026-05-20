import {
  assertGeminiFallbackBudgetAvailable,
  recordGeminiFallbackUsage,
  type GeminiUsageMetadata,
} from "@/lib/geminiFallbackBudget";

const AI_REQUEST_TIMEOUT_MS = 90_000;

type GeminiGenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: GeminiUsageMetadata;
};

export async function geminiDirectGenerateContent(
  model: string,
  apiKey: string,
  body: Record<string, unknown>,
  options?: { fallbackOutputTokens?: number },
): Promise<string> {
  await assertGeminiFallbackBudgetAvailable();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as GeminiGenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  await recordGeminiFallbackUsage(
    data.usageMetadata,
    options?.fallbackOutputTokens,
  );

  return text;
}
