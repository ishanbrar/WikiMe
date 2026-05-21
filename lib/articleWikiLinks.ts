import type { ArticleJson } from "@/types/article";
import {
  collectInlineWikiLinks,
  isCustomLinkUrl,
  removeWikiMarkupFromText,
  resolveLinkHref,
} from "@/lib/wikipediaLinks";

export type ArticleLinkEntry = {
  id: string;
  /** Visible text in the article (always the phrase / label). */
  term: string;
  /** Where the link goes: Wikipedia title or custom URL. */
  destination: string;
  source: "auto" | "inline";
};

function linkKey(term: string): string {
  return term.trim().toLowerCase();
}

export function listArticleLinks(article: ArticleJson): ArticleLinkEntry[] {
  const entries: ArticleLinkEntry[] = [];
  const titles = article.linkTitles ?? {};

  for (const term of article.properNouns) {
    const t = term.trim();
    if (!t) continue;
    entries.push({
      id: `auto:${linkKey(t)}`,
      term: t,
      destination: titles[t] ?? titles[linkKey(t)] ?? t,
      source: "auto",
    });
  }

  for (const inline of collectInlineWikiLinks(article)) {
    entries.push({
      id: `inline:${linkKey(inline.title)}:${linkKey(inline.label)}`,
      term: inline.label,
      destination: inline.title,
      source: "inline",
    });
  }

  return entries;
}

function setLinkDestination(
  linkTitles: Record<string, string>,
  term: string,
  destination: string,
): Record<string, string> {
  const t = term.trim();
  const dest = destination.trim() || t;
  const next = { ...linkTitles };
  if (dest !== t || isCustomLinkUrl(dest)) {
    next[t] = dest;
  } else {
    delete next[t];
  }
  return next;
}

export function upsertArticleLink(
  article: ArticleJson,
  term: string,
  destination: string,
): ArticleJson {
  const t = term.trim();
  if (!t) return article;

  const properNouns = article.properNouns.some(
    (p) => linkKey(p) === linkKey(t),
  )
    ? article.properNouns
    : [...article.properNouns, t];

  const linkTitles = setLinkDestination(article.linkTitles ?? {}, t, destination);
  return {
    ...article,
    properNouns,
    linkTitles: Object.keys(linkTitles).length ? linkTitles : undefined,
  };
}

/** @deprecated Use upsertArticleLink */
export const upsertAutoLink = upsertArticleLink;

export function removeArticleLink(
  article: ArticleJson,
  entry: ArticleLinkEntry,
): ArticleJson {
  if (entry.source === "auto") {
    const linkTitles = { ...(article.linkTitles ?? {}) };
    delete linkTitles[entry.term];
    for (const k of Object.keys(linkTitles)) {
      if (linkKey(k) === linkKey(entry.term)) delete linkTitles[k];
    }
    return {
      ...article,
      properNouns: article.properNouns.filter(
        (p) => linkKey(p) !== linkKey(entry.term),
      ),
      linkTitles: Object.keys(linkTitles).length ? linkTitles : undefined,
    };
  }

  const strip = (text: string) =>
    removeWikiMarkupFromText(text, entry.destination, entry.term);

  return {
    ...article,
    summaryLead: article.summaryLead.map(strip),
    seeAlso: article.seeAlso.map(strip),
    sections: article.sections.map((s) => ({
      ...s,
      paragraphs: s.paragraphs.map(strip),
      subsections: s.subsections?.map((sub) => ({
        ...sub,
        paragraphs: sub.paragraphs.map(strip),
      })),
    })),
  };
}

export function updateAutoLinkDestination(
  article: ArticleJson,
  term: string,
  destination: string,
): ArticleJson {
  const t = term.trim();
  if (!t) return article;
  const linkTitles = setLinkDestination(article.linkTitles ?? {}, t, destination);
  return {
    ...article,
    linkTitles: Object.keys(linkTitles).length ? linkTitles : undefined,
  };
}

function replaceInlineWikiMarkup(
  text: string,
  oldTitle: string,
  label: string,
  newTitle: string,
): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const display = label.trim();
  const old = oldTitle.trim();
  const next = newTitle.trim();
  if (!next) return text;

  const withLabel = new RegExp(
    `\\[\\[${esc(old)}\\|${esc(display)}\\]\\]`,
    "gi",
  );
  if (withLabel.test(text)) {
    return text.replace(withLabel, `[[${next}|${display}]]`);
  }
  if (display.toLowerCase() === old.toLowerCase()) {
    const simple = new RegExp(`\\[\\[${esc(old)}\\]\\]`, "gi");
    return text.replace(simple, `[[${next}]]`);
  }
  return text;
}

function mapArticleText(
  article: ArticleJson,
  fn: (text: string) => string,
): ArticleJson {
  return {
    ...article,
    summaryLead: article.summaryLead.map(fn),
    seeAlso: article.seeAlso.map(fn),
    sections: article.sections.map((s) => ({
      ...s,
      paragraphs: s.paragraphs.map(fn),
      subsections: s.subsections?.map((sub) => ({
        ...sub,
        paragraphs: sub.paragraphs.map(fn),
      })),
    })),
  };
}

export function updateInlineLinkDestination(
  article: ArticleJson,
  label: string,
  oldDestination: string,
  destination: string,
): ArticleJson {
  const next = destination.trim();
  if (!next || next === oldDestination.trim()) return article;
  return mapArticleText(article, (text) =>
    replaceInlineWikiMarkup(text, oldDestination, label, next),
  );
}

export function updateLinkDestination(
  article: ArticleJson,
  entry: ArticleLinkEntry,
  destination: string,
): ArticleJson {
  if (entry.source === "inline") {
    return updateInlineLinkDestination(
      article,
      entry.term,
      entry.destination,
      destination,
    );
  }
  return updateAutoLinkDestination(article, entry.term, destination);
}

export { resolveLinkHref };
