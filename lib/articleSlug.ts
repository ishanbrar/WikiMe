import {
  EXAMPLE_ARTICLE_SLUG,
  EXAMPLE_CREATIVE_SLUG,
  EXAMPLE_REALISM_SLUG,
} from "@/lib/exampleArticle";

const RESERVED = new Set([
  EXAMPLE_ARTICLE_SLUG,
  EXAMPLE_CREATIVE_SLUG,
  EXAMPLE_REALISM_SLUG,
  "admin",
  "api",
  "article",
  "generate",
  "login",
  "account",
  "share",
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeArticleSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export type SlugValidationResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export function validateArticleSlug(raw: string): SlugValidationResult {
  const slug = normalizeArticleSlug(raw);
  if (!slug) {
    return { ok: false, error: "Enter a link slug (letters, numbers, hyphens)." };
  }
  if (slug.length < 3) {
    return { ok: false, error: "Slug must be at least 3 characters." };
  }
  if (slug.length > 64) {
    return { ok: false, error: "Slug must be 64 characters or fewer." };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: "Use lowercase letters, numbers, and single hyphens only.",
    };
  }
  if (RESERVED.has(slug)) {
    return { ok: false, error: "That link is reserved." };
  }
  return { ok: true, slug };
}

export function isReservedArticleSlug(slug: string): boolean {
  return RESERVED.has(slug);
}
