const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.0-flash-001";
export const TEXT_MODEL =
  process.env.OPENROUTER_TEXT_MODEL ?? "google/gemini-2.0-flash-lite-001";
export const TEXT_MODEL_CREATIVE =
  process.env.OPENROUTER_CREATIVE_MODEL ?? "google/gemini-2.0-flash-001";

export function hasAiKey(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY,
  );
}

function getApiKey(): string | null {
  return (
    process.env.OPENROUTER_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    null
  );
}

function useOpenRouter(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
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

  if (useOpenRouter()) {
    const messages: TextMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ??
          (process.env.VERCEL === "1" ? "https://wikime.online" : "http://localhost:3003"),
        "X-Title": "WikiMe",
      },
      body: JSON.stringify({
        model: options?.model ?? TEXT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP,
        max_tokens: options?.maxTokens ?? 4096,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${res.status} ${err}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
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
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function generateVision(
  prompt: string,
  imageDataUrls: string[],
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("No AI API key configured");

  if (useOpenRouter()) {
    const content: VisionPart[] = [
      { type: "text", text: prompt },
      ...imageDataUrls.map((url) => ({
        type: "image_url" as const,
        image_url: { url },
      })),
    ];
    const messages: VisionMessage[] = [{ role: "user", content }];
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ??
          (process.env.VERCEL === "1" ? "https://wikime.online" : "http://localhost:3003"),
        "X-Title": "WikiMe",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter vision error: ${res.status} ${err}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

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
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini vision error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonStr) as T;
}
