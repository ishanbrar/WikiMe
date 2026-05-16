import type { SavedArticle } from "@/types/article";

const STORAGE_KEY = "wikime_saved_articles";
const DRAFT_KEY = "wikime_draft";
const FACTS_CACHE_KEY = "wikime_extracted_facts_cache";

export function getSavedArticles(): SavedArticle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedArticle[]) : [];
  } catch {
    return [];
  }
}

export function saveArticleLocal(article: SavedArticle): void {
  const list = getSavedArticles().filter((a) => a.id !== article.id);
  list.unshift(article);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
}

export function getArticleById(id: string): SavedArticle | null {
  return getSavedArticles().find((a) => a.id === id) ?? null;
}

export function deleteArticleLocal(id: string): void {
  const list = getSavedArticles().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function saveDraft(data: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

export function loadDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function cacheExtractedFacts(
  screenshotHashes: string[],
  facts: unknown,
): void {
  if (typeof window === "undefined") return;
  try {
    const cache = JSON.parse(
      localStorage.getItem(FACTS_CACHE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    const key = screenshotHashes.sort().join("|");
    cache[key] = facts;
    localStorage.setItem(FACTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function getCachedExtractedFacts(
  screenshotHashes: string[],
): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const cache = JSON.parse(
      localStorage.getItem(FACTS_CACHE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    const key = screenshotHashes.sort().join("|");
    return cache[key] ?? null;
  } catch {
    return null;
  }
}

export async function hashDataUrl(dataUrl: string): Promise<string> {
  const slice = dataUrl.slice(0, 2000) + dataUrl.length;
  if (typeof window === "undefined") return slice;
  const enc = new TextEncoder().encode(slice);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
