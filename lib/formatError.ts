/** Turn any thrown value or API error payload into user-readable text. */
export function formatUnknownError(err: unknown): string {
  if (err == null) return "Something went wrong";
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Cancelled";
  }
  if (err instanceof Error) return err.message || "Something went wrong";
  if (typeof err === "string") return err.trim() || "Something went wrong";

  if (typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
    if (o.error && typeof o.error === "object") {
      const inner = formatUnknownError(o.error);
      if (inner !== "Something went wrong") return inner;
    }
    if (typeof o.detail === "string" && o.detail.trim()) return o.detail.trim();
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      /* ignore */
    }
  }

  const s = String(err);
  return s === "[object Object]" ? "Something went wrong" : s;
}
