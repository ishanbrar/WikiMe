import {
  openRouterChatCompletion,
  textModelFallbackChain,
  visionModelFallbackChain,
} from "@/lib/openRouter";

/** Per OpenRouter/Gemini request — prevents hung generations. */
const AI_REQUEST_TIMEOUT_MS = 90_000;

export const VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.0-flash-001";
export const TEXT_MODEL =
  process.env.OPENROUTER_TEXT_MODEL ?? "google/gemini-2.0-flash-lite-001";
export const TEXT_MODEL_CREATIVE =
  process.env.OPENROUTER_CREATIVE_MODEL ?? "google/gemini-2.0-flash-001";
/** Stronger model for Realism — must interpret and rewrite intake, not paste it. */
export const TEXT_MODEL_REALISM =
  process.env.OPENROUTER_REALISM_MODEL ??
  process.env.OPENROUTER_TEXT_MODEL ??
  "google/gemini-2.0-flash-001";

export function hasAiKey(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY,
  );
}

function getOpenRouterKey(): string | null {
  return process.env.OPENROUTER_API_KEY ?? null;
}

function getDirectGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY ?? null;
}

function getApiKey(): string | null {
  return getOpenRouterKey() ?? getDirectGeminiKey() ?? process.env.OPENAI_API_KEY ?? null;
}

function useOpenRouter(): boolean {
  return Boolean(getOpenRouterKey());
}

type TextMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type VisionPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type VisionMessage = {
  role: "user";
  content: VisionPart[];
};

function wrapAiFetchError(e: unknown): Error {
  if (e instanceof DOMException && e.name === "TimeoutError") {
    return new Error(
      "AI request timed out (90s). Try again with a shorter article or fewer images.",
    );
  }
  if (e instanceof Error) return e;
  return new Error(String(e));
}

function isRateLimitError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /rate limit|429/i.test(msg);
}

async function directGeminiGenerateText(
  system: string,
  user: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const key = getDirectGeminiKey();
  if (!key) throw new Error("No Gemini API key configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function directGeminiVision(
  prompt: string,
  imageDataUrls: string[],
): Promise<string> {
  const key = getDirectGeminiKey();
  if (!key) throw new Error("No Gemini API key configured");

  const parts = [
    { text: prompt },
    ...imageDataUrls.map((url) => {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return { text: "[invalid image]" };
      return { inline_data: { mime_type: match[1], data: match[2] } };
    }),
  ];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini vision error: ${res.status} ${err.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function generateText(
  system: string,
  user: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    topP?: number;
  },
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("No AI API key configured");

  const preferred = options?.model ?? TEXT_MODEL;

  try {
    if (useOpenRouter()) {
      try {
        return await openRouterChatCompletion(
          getOpenRouterKey()!,
          {
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: options?.temperature ?? 0.7,
            top_p: options?.topP,
            max_tokens: options?.maxTokens ?? 4096,
            response_format: { type: "json_object" },
          },
          {
            models: textModelFallbackChain(preferred),
            signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
            label: "generateText",
          },
        );
      } catch (e) {
        if (isRateLimitError(e) && getDirectGeminiKey()) {
          console.warn("[WikiMe] OpenRouter rate-limited; falling back to GEMINI_API_KEY");
          return await directGeminiGenerateText(system, user, options);
        }
        throw e;
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error: ${res.status} ${err.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (e) {
    throw wrapAiFetchError(e);
  }
}

export async function generateVision(
  prompt: string,
  imageDataUrls: string[],
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("No AI API key configured");

  try {
    if (useOpenRouter()) {
      const content: VisionPart[] = [
        { type: "text", text: prompt },
        ...imageDataUrls.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
      ];
      try {
        return await openRouterChatCompletion(
          getOpenRouterKey()!,
          {
            messages: [{ role: "user", content }],
            temperature: 0.2,
            max_tokens: 2048,
            response_format: { type: "json_object" },
          },
          {
            models: visionModelFallbackChain(VISION_MODEL),
            signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
            label: "generateVision",
          },
        );
      } catch (e) {
        if (isRateLimitError(e) && getDirectGeminiKey()) {
          console.warn("[WikiMe] OpenRouter vision rate-limited; falling back to GEMINI_API_KEY");
          return await directGeminiVision(prompt, imageDataUrls);
        }
        throw e;
      }
    }

    return await directGeminiVision(prompt, imageDataUrls);
  } catch (e) {
    throw wrapAiFetchError(e);
  }
}

export { parseJsonFromModel } from "@/lib/parseModelJson";
