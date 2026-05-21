export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.status === 413
        ? "Upload too large even after compression. Try fewer images or smaller originals."
        : `Empty response from server (HTTP ${res.status} ${res.statusText || ""}). The app may be busy or restarting — try again in a moment.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.status === 413
        ? "Upload too large. Try fewer or smaller images."
        : `Could not read server JSON (HTTP ${res.status} ${res.statusText || ""}). Try again; if it persists, pick a shorter article length.`,
    );
  }
}
