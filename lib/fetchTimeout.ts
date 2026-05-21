/** Link user cancel + wall-clock timeout into one AbortSignal. */
export function linkedAbortSignal(
  timeoutMs: number,
  external?: AbortSignal | null,
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => {
    clearTimeout(timeoutId);
    controller.abort();
  };

  if (external) {
    if (external.aborted) onExternalAbort();
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const { signal, clear } = linkedAbortSignal(timeoutMs, init?.signal ?? null);
  try {
    return await fetch(input, { ...init, signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      const external = init?.signal;
      if (external?.aborted) throw e;
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. Try again with a shorter article or fewer images.`,
      );
    }
    if (e instanceof TypeError) {
      const m = e.message?.toLowerCase() ?? "";
      if (m === "load failed" || m === "failed to fetch" || m.includes("network")) {
        throw new Error(
          "Network error while contacting the server (connection was reset or blocked). Check your connection, try again in a moment, or use smaller photos.",
        );
      }
    }
    throw e;
  } finally {
    clear();
  }
}
