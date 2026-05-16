import type { ExtractedProfileFacts } from "@/types/article";
import { generateVision, hasAiKey, parseJsonFromModel } from "@/lib/gemini";
import { extractedFactsSchema } from "@/lib/validation";

const EXTRACTION_PROMPT = `Extract profile facts from these social media / website screenshots.
Return ONLY valid JSON matching this schema (no markdown):
{
  "detectedName": string | null,
  "headline": string | null,
  "bio": string | null,
  "location": string | null,
  "education": string[],
  "work": string[],
  "projects": string[],
  "skills": string[],
  "links": string[],
  "notableClaims": string[],
  "rawUsefulText": string[]
}
Rules: extract only visible facts; keep arrays small and deduplicated; no hallucination; null/empty if unclear.`;

export function emptyExtractedFacts(): ExtractedProfileFacts {
  return {
    detectedName: null,
    headline: null,
    bio: null,
    location: null,
    education: [],
    work: [],
    projects: [],
    skills: [],
    links: [],
    notableClaims: [],
    rawUsefulText: [],
  };
}

/** Merge partial/cached vision output into a complete facts object. */
export function normalizeExtractedFacts(input: unknown): ExtractedProfileFacts {
  const base = emptyExtractedFacts();
  if (!input || typeof input !== "object") return base;
  const o = input as Record<string, unknown>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    detectedName:
      typeof o.detectedName === "string" || o.detectedName === null
        ? (o.detectedName as string | null)
        : base.detectedName,
    headline:
      typeof o.headline === "string" || o.headline === null
        ? (o.headline as string | null)
        : base.headline,
    bio:
      typeof o.bio === "string" || o.bio === null
        ? (o.bio as string | null)
        : base.bio,
    location:
      typeof o.location === "string" || o.location === null
        ? (o.location as string | null)
        : base.location,
    education: arr(o.education),
    work: arr(o.work),
    projects: arr(o.projects),
    skills: arr(o.skills),
    links: arr(o.links),
    notableClaims: arr(o.notableClaims),
    rawUsefulText: arr(o.rawUsefulText),
  };
}

export function mergeExtractedFacts(
  a: ExtractedProfileFacts,
  b: ExtractedProfileFacts,
): ExtractedProfileFacts {
  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))];
  return {
    detectedName: a.detectedName ?? b.detectedName,
    headline: a.headline ?? b.headline,
    bio: [a.bio, b.bio].filter(Boolean).join(" ").slice(0, 500) || null,
    location: a.location ?? b.location,
    education: uniq([...a.education, ...b.education]),
    work: uniq([...a.work, ...b.work]),
    projects: uniq([...a.projects, ...b.projects]),
    skills: uniq([...a.skills, ...b.skills]),
    links: uniq([...a.links, ...b.links]),
    notableClaims: uniq([...a.notableClaims, ...b.notableClaims]),
    rawUsefulText: uniq([...a.rawUsefulText, ...b.rawUsefulText]).slice(0, 8),
  };
}

export async function extractProfileFactsFromScreenshots(
  imageDataUrls: string[],
): Promise<ExtractedProfileFacts> {
  if (!imageDataUrls.length) return emptyExtractedFacts();
  if (!hasAiKey()) return mockExtractFromImages(imageDataUrls.length);

  const raw = await generateVision(EXTRACTION_PROMPT, imageDataUrls);
  const parsed = parseJsonFromModel<ExtractedProfileFacts>(raw);
  const result = extractedFactsSchema.safeParse(parsed);
  if (result.success) return result.data;
  return emptyExtractedFacts();
}

function mockExtractFromImages(count: number): ExtractedProfileFacts {
  return {
    detectedName: null,
    headline: "Professional profile (mock extraction)",
    bio: `Facts extracted from ${count} screenshot(s) in demo mode.`,
    location: null,
    education: [],
    work: ["Various roles per uploaded profile"],
    projects: [],
    skills: [],
    links: [],
    notableClaims: [],
    rawUsefulText: ["Mock: enable OPENROUTER_API_KEY for real vision extraction."],
  };
}
