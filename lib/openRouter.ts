const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MAX_RETRIES_PER_MODEL = 3;
const INITIAL_RETRY_MS = 2000;

export function openRouterReferer(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL === "1" ? "https://wikime.online" : "http://localhost:3003")
  );
}

/** Models to try when the preferred slug is rate-limited on OpenRouter. */
export function textModelFallbackChain(preferred: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  const add = (m: string) => {
    const id = m.trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    chain.push(id);
  };

  add(preferred);
  if (preferred.includes("flash-001") && !preferred.includes("lite")) {
    add("google/gemini-2.0-flash-lite-001");
  }
  add("google/gemini-2.5-flash");
  add("google/gemini-2.0-flash-lite-001");

  const extra = process.env.OPENROUTER_FALLBACK_MODELS?.split(",").map((s) => s.trim());
  if (extra) for (const m of extra) add(m);

  return chain;
}

export function visionModelFallbackChain(preferred: string): string[] {
  const chain = textModelFallbackChain(preferred);
  if (!chain.includes("google/gemini-2.0-flash-lite-001")) {
    chain.push("google/gemini-2.0-flash-lite-001");
  }
  return chain;
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 425 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 524 ||
    status === 529
  );
}

function parseRateLimitMessage(status: number, body: string): string {
  if (status !== 429) {
    return `OpenRouter error (${status}). Please try again in a moment.`;
  }
  try {
    const data = JSON.parse(body) as {
      error?: { metadata?: { raw?: string }; message?: string };
    };
    const raw = data.error?.metadata?.raw ?? data.error?.message ?? "";
    if (/rate-limit/i.test(raw)) {
      return "AI is temporarily busy (rate limit). We retried automatically — please wait a minute and try again. You can also add your own Google API key at https://openrouter.ai/settings/integrations or set GEMINI_API_KEY on the server.";
    }
  } catch {
    /* ignore */
  }
  return "AI rate limit reached. Please try again in a minute.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function openRouterChatCompletion(
  apiKey: string,
  body: Record<string, unknown>,
  options: {
    models: string[];
    signal?: AbortSignal;
    label?: string;
  },
): Promise<string> {
  const models = options.models.filter(Boolean);
  if (!models.length) throw new Error("No OpenRouter model configured");

  let lastError = "OpenRouter request failed";

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": openRouterReferer(),
          "X-Title": "WikiMe",
        },
        body: JSON.stringify({ ...body, model }),
        signal: options.signal,
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        if (!text.trim()) {
          lastError = "OpenRouter returned empty model output";
          if (options.label) {
            console.warn(
              `[WikiMe] OpenRouter empty content (${model}, ${options.label}) — will retry`,
            );
          }
          if (attempt < MAX_RETRIES_PER_MODEL - 1) {
            await sleep(INITIAL_RETRY_MS * 2 ** attempt);
            continue;
          }
          break;
        }
        if (models[0] !== model) {
          console.info(`[WikiMe] OpenRouter used fallback model: ${model}`);
        }
        return text;
      }

      const errBody = await res.text();
      lastError = parseRateLimitMessage(res.status, errBody);

      if (!isRetryableStatus(res.status)) {
        throw new Error(
          `OpenRouter error: ${res.status} ${errBody.slice(0, 500)}`,
        );
      }

      if (attempt < MAX_RETRIES_PER_MODEL - 1) {
        await sleep(INITIAL_RETRY_MS * 2 ** attempt);
        continue;
      }

      console.warn(
        `[WikiMe] OpenRouter ${res.status} on ${model}, trying next model…`,
      );
      break;
    }
  }

  throw new Error(lastError);
}
