import type { ArticleInfobox } from "@/types/article";
import { extractPlaceFromBornLine } from "@/lib/infoboxHelpers";

const MAX_LINKS_PER_TERM = 2;

/** Terms we never auto-link (too generic or not real article titles). */
const DENY_TERMS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "present",
  "army",
  "general",
  "university",
  "college",
  "school",
  "company",
  "inc",
  "llc",
]);

/** Map common abbreviations → Wikipedia article title (must be real pages). */
const WIKI_TITLE_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "u.s.": "United States",
  uk: "United Kingdom",
  nyc: "New York City",
  "new york": "New York City",
  "new york city": "New York City",
  la: "Los Angeles",
  dc: "Washington, D.C.",
  un: "United Nations",
  nato: "NATO",
};

export type WikiTextSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; title: string };

export function toWikiSlug(title: string): string {
  return encodeURIComponent(title.trim().replace(/\s+/g, "_"));
}

export function wikiUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${toWikiSlug(title)}`;
}

/** Remove broken [[WIKI:...]] markers (legacy / double-linked text). */
export function stripWikiMarkers(text: string): string {
  let out = text;
  let prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(/\[\[WIKI:([^\]]*)\]\]/gi, "$1");
  }
  return out.replace(/\[\[|\]\]/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wikipedia article title for linking (alias map + trim). */
export function resolveWikiTitle(term: string): string {
  const t = term.trim();
  const alias = WIKI_TITLE_ALIASES[t.toLowerCase()];
  return alias ?? t;
}

/** Only use model-provided proper nouns — do not invent links from infobox text. */
export function getLinkableTerms(
  properNouns: string[],
  subjectName: string,
): string[] {
  const subjectLower = subjectName.toLowerCase().trim();
  const seen = new Set<string>();

  return properNouns
    .map((t) => t.trim())
    .filter((t) => t.length > 2)
    .filter((t) => t.toLowerCase() !== subjectLower)
    .filter((t) => !DENY_TERMS.has(t.toLowerCase()))
    .filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.length - a.length);
}

interface MatchSpan {
  start: number;
  end: number;
  display: string;
  title: string;
}

const WIKI_MARKUP_RE = /\[\[([^[\]]+?)(?:\|([^[\]]+?))?\]\]/g;

function titleForTerm(
  display: string,
  linkTitles?: Record<string, string>,
): string {
  const key = display.trim();
  const override =
    linkTitles?.[key] ??
    linkTitles?.[key.toLowerCase()] ??
    Object.entries(linkTitles ?? {}).find(
      ([k]) => k.toLowerCase() === key.toLowerCase(),
    )?.[1];
  return override?.trim() ? resolveWikiTitle(override) : resolveWikiTitle(key);
}

function segmentAutoWikiLinks(
  text: string,
  properNouns: string[],
  subjectName: string,
  options?: { maxPerTerm?: number },
  linkTitles?: Record<string, string>,
): WikiTextSegment[] {
  const clean = stripWikiMarkers(text);
  if (!clean) return [{ type: "text", value: "" }];

  const terms = getLinkableTerms(properNouns, subjectName);
  if (!terms.length) return [{ type: "text", value: clean }];

  const maxPerTerm = options?.maxPerTerm ?? MAX_LINKS_PER_TERM;
  const termCounts = new Map<string, number>();
  const spans: MatchSpan[] = [];

  for (const term of terms) {
    const regex = new RegExp(`\\b(${escapeRegex(term)})\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(clean)) !== null) {
      const display = m[1];
      const key = display.toLowerCase();
      const used = termCounts.get(key) ?? 0;
      if (used >= maxPerTerm) continue;

      const start = m.index;
      const end = start + m[0].length;
      if (spans.some((s) => start < s.end && end > s.start)) continue;

      termCounts.set(key, used + 1);
      spans.push({
        start,
        end,
        display,
        title: titleForTerm(display, linkTitles),
      });
    }
  }

  if (!spans.length) return [{ type: "text", value: clean }];

  spans.sort((a, b) => a.start - b.start);

  const parts: WikiTextSegment[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start > cursor) {
      parts.push({ type: "text", value: clean.slice(cursor, s.start) });
    }
    parts.push({ type: "link", value: s.display, title: s.title });
    cursor = s.end;
  }
  if (cursor < clean.length) {
    parts.push({ type: "text", value: clean.slice(cursor) });
  }
  return parts;
}

function mergeSegmentParts(parts: WikiTextSegment[]): WikiTextSegment[] {
  const merged: WikiTextSegment[] = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (prev?.type === "text" && p.type === "text") {
      prev.value += p.value;
    } else {
      merged.push({ ...p });
    }
  }
  return merged;
}

/**
 * Split text into plain text and Wikipedia links ([[markup]] first, then auto-link terms).
 */
export function segmentWikiLinks(
  text: string,
  properNouns: string[],
  subjectName: string,
  options?: { maxPerTerm?: number; linkTitles?: Record<string, string> },
): WikiTextSegment[] {
  if (!text) return [{ type: "text", value: "" }];
  if (WIKI_MARKUP_RE.test(text)) {
    WIKI_MARKUP_RE.lastIndex = 0;
    const parts: WikiTextSegment[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    const re = new RegExp(WIKI_MARKUP_RE.source, "g");
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        parts.push(
          ...segmentAutoWikiLinks(
            text.slice(last, m.index),
            properNouns,
            subjectName,
            options,
            options?.linkTitles,
          ),
        );
      }
      const titleRaw = m[1].trim();
      const display = (m[2] ?? m[1]).trim();
      parts.push({
        type: "link",
        value: display,
        title: resolveWikiTitle(titleRaw),
      });
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      parts.push(
        ...segmentAutoWikiLinks(
          text.slice(last),
          properNouns,
          subjectName,
          options,
          options?.linkTitles,
        ),
      );
    }
    return mergeSegmentParts(parts);
  }

  return segmentAutoWikiLinks(
    text,
    properNouns,
    subjectName,
    options,
    options?.linkTitles,
  );
}

/** Collect [[title|label]] links from all article text fields. */
export function collectInlineWikiLinks(article: {
  summaryLead: string[];
  sections: { paragraphs: string[]; subsections?: { paragraphs: string[] }[] }[];
  seeAlso: string[];
}): { title: string; label: string }[] {
  const found: { title: string; label: string }[] = [];
  const seen = new Set<string>();
  const scan = (t: string) => {
    const re = new RegExp(WIKI_MARKUP_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(t)) !== null) {
      const title = m[1].trim();
      const label = (m[2] ?? m[1]).trim();
      const key = `${title}\0${label}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ title, label });
      }
    }
  };
  for (const p of article.summaryLead) scan(p);
  for (const s of article.sections) {
    for (const p of s.paragraphs) scan(p);
    for (const sub of s.subsections ?? []) {
      for (const p of sub.paragraphs) scan(p);
    }
  }
  for (const item of article.seeAlso) scan(item);
  return found;
}

/** Remove one [[title|label]] occurrence from text (first match). */
export function removeWikiMarkupFromText(
  text: string,
  title: string,
  label?: string,
): string {
  const esc = escapeRegex(title.trim());
  const display = label?.trim() ?? title.trim();
  const withLabel = new RegExp(
    `\\[\\[${esc}\\|${escapeRegex(display)}\\]\\]`,
    "i",
  );
  if (withLabel.test(text)) {
    return text.replace(withLabel, display);
  }
  const simple = new RegExp(`\\[\\[${esc}\\]\\]`, "i");
  return text.replace(simple, display);
}

/** @deprecated Use segmentWikiLinks */
export function linkProperNounsInText(
  text: string,
  properNouns: string[],
  subjectName: string,
): string {
  return stripWikiMarkers(text);
}

/** @deprecated Use segmentWikiLinks */
export function splitWikiLinks(
  text: string,
): Array<{ type: "text" | "link"; value: string }> {
  return [{ type: "text", value: stripWikiMarkers(text) }];
}

function placeLinkTermsFromField(text: string): string[] {
  const place = extractPlaceFromBornLine(text).trim();
  if (!place) return [];
  const terms: string[] = [place];
  const parts = place
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && !/^u\.s\.?$/i.test(p));
  if (parts.length >= 2) {
    terms.push(`${parts[0]}, ${parts[1]}`);
  }
  for (const p of parts) {
    terms.push(p);
    const alias = WIKI_TITLE_ALIASES[p.toLowerCase()];
    if (alias) terms.push(alias);
  }
  const lower = place.toLowerCase();
  if (lower.includes("new york")) {
    terms.push("New York City", "New York");
  }
  if (lower.includes("san francisco")) terms.push("San Francisco");
  if (lower.includes("los angeles")) terms.push("Los Angeles");
  if (lower.includes("dallas")) terms.push("Dallas", "Texas");
  return terms;
}

/** Merge model proper nouns with infobox places so locations link consistently. */
export function expandLinkTermsForInfobox(
  properNouns: string[],
  infobox: ArticleInfobox,
  subjectName: string,
): string[] {
  const extra: string[] = [
    ...placeLinkTermsFromField(infobox.born),
    ...placeLinkTermsFromField(infobox.hometown),
    ...placeLinkTermsFromField(infobox.currentLocation),
    ...placeLinkTermsFromField(infobox.education),
    ...placeLinkTermsFromField(infobox.died ?? ""),
  ];
  return getLinkableTerms([...properNouns, ...extra], subjectName);
}
