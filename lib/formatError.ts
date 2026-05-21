function friendlyNetworkMessage(msg: string): string | null {
  const m = msg.trim();
  if (!m) return null;
  const lower = m.toLowerCase();
  if (
    lower === "load failed" ||
    lower === "failed to fetch" ||
    lower.includes("networkerror") ||
    lower.includes("network request failed")
  ) {
    return (
      "Could not reach the server (network error). Check your connection, try turning off VPNs or strict blockers, " +
      "or wait a moment and tap Generate again. If you uploaded large photos, try smaller originals."
    );
  }
  return null;
}

/** Turn any thrown value or API error payload into user-readable text. */
export function formatUnknownError(err: unknown): string {
  if (err == null) {
    return "Unknown error (no message). If this keeps happening, try again with fewer or smaller images.";
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Cancelled";
  }
  if (err instanceof TypeError) {
    const net = friendlyNetworkMessage(err.message);
    if (net) return net;
  }
  if (err instanceof Error) {
    const net = friendlyNetworkMessage(err.message);
    if (net) return net;
    const msg = err.message?.trim();
    if (msg) return msg;
    if (err.cause != null) {
      const cause = formatUnknownError(err.cause);
      if (!cause.startsWith("Unknown error") && cause !== "Generation failed unexpectedly. Try again.") {
        return cause;
      }
    }
    if (err.name && err.name !== "Error") {
      return `Generation failed (${err.name}). Try again.`;
    }
    return "Generation failed unexpectedly. Try again.";
  }
  if (typeof err === "string") {
    const t = err.trim();
    const net = friendlyNetworkMessage(t);
    if (net) return net;
    return t || "Generation failed unexpectedly. Try again.";
  }

  if (typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) {
      const inner = formatUnknownError(o.message);
      if (inner) return inner;
    }
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
    if (o.error && typeof o.error === "object") {
      const inner = formatUnknownError(o.error);
      if (inner) return inner;
    }
    if (typeof o.detail === "string" && o.detail.trim()) return o.detail.trim();
    if (typeof o.status === "number" && typeof o.statusText === "string") {
      const st = `${o.status} ${o.statusText}`.trim();
      if (st) return `HTTP ${st}`;
    }
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      /* ignore */
    }
  }

  const s = String(err);
  if (s === "[object Object]") {
    return "Unknown error (unreadable object). Try again; if it persists, open a shorter article length or fewer images.";
  }
  const net = friendlyNetworkMessage(s);
  if (net) return net;
  return s;
}
