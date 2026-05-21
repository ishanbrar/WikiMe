import {
  segmentWikiLinks,
  type WikiTextSegment,
} from "@/lib/wikipediaLinks";

const MAX_ENTRIES = 512;
const cache = new Map<string, WikiTextSegment[]>();

function cacheKey(
  text: string,
  properNouns: string[],
  subjectName: string,
  maxPerTerm?: number,
  linkTitles?: Record<string, string>,
): string {
  const lt = linkTitles
    ? Object.entries(linkTitles)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("\x1f")
    : "";
  return `${text}\x00${properNouns.join("\x1e")}\x00${subjectName}\x00${maxPerTerm ?? ""}\x00${lt}`;
}

export function getCachedWikiSegments(
  text: string,
  properNouns: string[],
  subjectName: string,
  options?: { maxPerTerm?: number; linkTitles?: Record<string, string> },
): WikiTextSegment[] {
  const key = cacheKey(
    text,
    properNouns,
    subjectName,
    options?.maxPerTerm,
    options?.linkTitles,
  );
  const hit = cache.get(key);
  if (hit) return hit;

  const segments = segmentWikiLinks(text, properNouns, subjectName, options);
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, segments);
  return segments;
}
