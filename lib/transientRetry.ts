/**
 * Shared logic for retrying flaky network calls and common upstream outages
 * (OpenRouter, edge proxies) without retrying validation or auth failures.
 */

export const TRANSIENT_HTTP_STATUSES = new Set([
  408, 425, 429, 500, 502, 503, 504, 524, 529,
]);

export function isTransientHttpStatus(status: number): boolean {
  return TRANSIENT_HTTP_STATUSES.has(status);
}

export function isTransientNetworkError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return false;
  if (e instanceof DOMException && e.name === "TimeoutError") return true;
  if (e instanceof TypeError) {
    const lower = (e.message || "").toLowerCase();
    return (
      lower === "failed to fetch" ||
      lower === "load failed" ||
      lower.includes("network") ||
      lower.includes("fetch")
    );
  }
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (/request timed out after \d+s/i.test(msg)) return true;
  if (
    /load failed|failed to fetch|networkerror|network request failed|econnreset|econnrefused|socket hang up/i.test(
      lower,
    )
  ) {
    return true;
  }
  return false;
}

/** True when the error is worth retrying once or more (same request body). */
export function isTransientFailure(e: unknown): boolean {
  if (isTransientNetworkError(e)) return true;
  if (e instanceof Error && !e.message.trim()) return true;
  if (!(e instanceof Error)) return false;
  const m = e.message;
  if (/Article API returned HTTP \d+ \(transient\)/.test(m)) return true;
  if (/Save article API returned HTTP \d+ \(transient\)/.test(m)) return true;
  if (/Extract API HTTP \d+/.test(m)) return true;
  if (/HTTP (408|425|429|500|502|503|504|524|529)\b/.test(m)) return true;
  if (/OpenRouter error: (408|425|429|500|502|503|504|524|529)\b/i.test(m)) return true;
  if (/AI is temporarily busy|rate limit/i.test(m)) return true;
  if (/AI request timed out/i.test(m)) return true;
  if (/empty response from server/i.test(m)) return true;
  if (/could not reach the server \(network error\)/i.test(m)) return true;
  if (/network error while contacting the server/i.test(m)) return true;
  if (/AI returned an empty response/i.test(m)) return true;
  if (/Vision model returned empty JSON/i.test(m)) return true;
  return false;
}

export async function withTransientRetry<T>(
  fn: (attemptIndex: number) => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number; label?: string },
): Promise<T> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 4);
  const baseDelayMs = options?.baseDelayMs ?? 600;
  let last: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn(i);
    } catch (e) {
      last = e;
      const canRetry = i < maxAttempts - 1 && isTransientFailure(e);
      if (!canRetry) throw e;
      const delay = Math.min(baseDelayMs * 2 ** i, 12_000);
      const tag = options?.label ? `[WikiMe:${options.label}]` : "[WikiMe]";
      console.warn(
        `${tag} transient failure (attempt ${i + 1}/${maxAttempts}), retry in ${delay}ms:`,
        e instanceof Error ? e.message : e,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last;
}
