import { ADMIN_TEST_HEADER } from "@/lib/adminConstants";
import { formatUnknownError } from "@/lib/formatError";

export function adminTestHeaders(isAdmin: boolean): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isAdmin) headers[ADMIN_TEST_HEADER] = "1";
  return headers;
}

export type ApiErrorBody = {
  error?: unknown;
  adminLog?: string[];
  details?: unknown;
};

export function apiErrorMessage(data: ApiErrorBody, res: Response): string {
  const base =
    data.error != null
      ? formatUnknownError(data.error)
      : `Request failed (${res.status})`;
  if (!data.adminLog?.length) return base;
  return `${base}\n\nServer log:\n${data.adminLog.map((l) => `• ${l}`).join("\n")}`;
}
