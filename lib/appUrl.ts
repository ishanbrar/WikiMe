/** Production custom domain — used for share/permanent links when env is unset. */
export const CANONICAL_APP_URL = "https://wikime.online";

/** Canonical app URL for share links and auth redirects (server). */
export function getAppBaseUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL === "1") {
    return CANONICAL_APP_URL;
  }

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3003";
}

/** Share link base in the browser (client components). */
export function getClientAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return window.location.origin;
    }
  }

  return CANONICAL_APP_URL;
}

export function isVercelDeployment(): boolean {
  return process.env.VERCEL === "1";
}
