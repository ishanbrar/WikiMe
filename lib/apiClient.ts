export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.status === 413
        ? "Upload too large. Try fewer or smaller images."
        : `Server error (${res.status})`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.status === 413
        ? "Upload too large. Try fewer or smaller images."
        : `Unexpected server response (${res.status})`,
    );
  }
}
