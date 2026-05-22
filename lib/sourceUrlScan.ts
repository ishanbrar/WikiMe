const DEFAULT_MAX_LINKS = 8;

export function normalizeScannedUrl(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[),.;\]}>]+$/g, "")
    .replace(/^["'(<{\[]+/g, "");
  try {
    const url = new URL(cleaned);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (
      /(^|\.)google\.[a-z.]+$/i.test(url.hostname) &&
      url.pathname === "/url" &&
      url.searchParams.get("url")
    ) {
      return normalizeScannedUrl(url.searchParams.get("url")!);
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function extractUrlsFromText(
  text: string,
  maxLinks = DEFAULT_MAX_LINKS,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
    const url = normalizeScannedUrl(match[0]);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= maxLinks) break;
  }
  return urls;
}
