import {
  openRouterChatCompletion,
  textModelFallbackChain,
  visionModelFallbackChain,
} from "@/lib/openRouter";
import { geminiDirectGenerateContent } from "@/lib/geminiDirect";

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

function shouldUseOpenRouter(): boolean {
  return Boolean(getOpenRouterKey());
}

type VisionPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function wrapAiFetchError(e: unknown): Error {
  if (e instanceof DOMException && e.name === "TimeoutError") {
    return new Error(
      "AI request timed out. Try again with a shorter article length, fewer images, or wait a minute if the AI service is busy.",
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

  return geminiDirectGenerateContent(
    "gemini-2.0-flash",
    key,
    {
      contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
        responseMimeType: "application/json",
      },
    },
    { fallbackOutputTokens: options?.maxTokens ?? 4096 },
  );
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

  return geminiDirectGenerateContent(
    "gemini-2.0-flash",
    key,
    {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    },
    { fallbackOutputTokens: 2048 },
  );
}

export async function generateText(
  system: string,
  user: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    topP?: number;
    /** Wall-clock cap for the OpenRouter HTTP request (direct Gemini uses SDK defaults). */
    requestTimeoutMs?: number;
  },
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("No AI API key configured");

  const preferred = options?.model ?? TEXT_MODEL;
  const requestTimeoutMs = options?.requestTimeoutMs ?? AI_REQUEST_TIMEOUT_MS;

  try {
    if (shouldUseOpenRouter()) {
      try {
        for (let pass = 0; pass < 3; pass++) {
          const out = await openRouterChatCompletion(
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
              signal: AbortSignal.timeout(requestTimeoutMs),
              label: "generateText",
            },
          );
          if (out.trim()) return out;
          console.warn(`[WikiMe] generateText empty body from OpenRouter (pass ${pass + 1}/3)`);
        }
        throw new Error(
          "AI returned an empty response after retries. Please tap Generate again in a few seconds.",
        );
      } catch (e) {
        if (isRateLimitError(e) && getDirectGeminiKey()) {
          console.warn("[WikiMe] OpenRouter rate-limited; falling back to GEMINI_API_KEY");
          return await directGeminiGenerateText(system, user, options);
        }
        throw e;
      }
    }

    if (!getDirectGeminiKey()) {
      throw new Error("Direct Gemini requires GEMINI_API_KEY when OpenRouter is not configured");
    }

    return geminiDirectGenerateContent(
      "gemini-2.0-flash-lite",
      getDirectGeminiKey()!,
      {
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096,
          responseMimeType: "application/json",
        },
      },
      { fallbackOutputTokens: options?.maxTokens ?? 4096 },
    );
  } catch (e) {
    throw wrapAiFetchError(e);
  }
}

export async function generateVision(
  prompt: string,
  imageDataUrls: string[],
  options?: {
    maxTokens?: number;
    requestTimeoutMs?: number;
  },
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("No AI API key configured");
  const maxTokens = options?.maxTokens ?? 2048;
  const requestTimeoutMs = options?.requestTimeoutMs ?? AI_REQUEST_TIMEOUT_MS;

  try {
    if (shouldUseOpenRouter()) {
      const content: VisionPart[] = [
        { type: "text", text: prompt },
        ...imageDataUrls.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
      ];
      try {
        for (let pass = 0; pass < 3; pass++) {
          const out = await openRouterChatCompletion(
            getOpenRouterKey()!,
            {
              messages: [{ role: "user", content }],
              temperature: 0.2,
              max_tokens: maxTokens,
              response_format: { type: "json_object" },
            },
            {
              models: visionModelFallbackChain(VISION_MODEL),
              signal: AbortSignal.timeout(requestTimeoutMs),
              label: "generateVision",
            },
          );
          if (out.trim()) return out;
          console.warn(`[WikiMe] generateVision empty body (pass ${pass + 1}/3)`);
        }
        throw new Error(
          "Vision model returned empty JSON after retries. Please try Generate again.",
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
