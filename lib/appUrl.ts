/** Canonical app URL for share links and auth redirects. */
export function getAppBaseUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3003";
}

export function isVercelDeployment(): boolean {
  return process.env.VERCEL === "1";
}
