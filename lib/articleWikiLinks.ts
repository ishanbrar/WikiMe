import type { ArticleJson } from "@/types/article";
import {
  collectInlineWikiLinks,
  removeWikiMarkupFromText,
  wikiUrl,
} from "@/lib/wikipediaLinks";

export type ArticleLinkEntry = {
  id: string;
  term: string;
  title: string;
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
      title: titles[t] ?? titles[linkKey(t)] ?? t,
      source: "auto",
    });
  }

  for (const inline of collectInlineWikiLinks(article)) {
    entries.push({
      id: `inline:${linkKey(inline.title)}:${linkKey(inline.label)}`,
      term: inline.label,
      title: inline.title,
      source: "inline",
    });
  }

  return entries;
}

export function upsertAutoLink(
  article: ArticleJson,
  term: string,
  title: string,
): ArticleJson {
  const t = term.trim();
  const wikiTitle = title.trim() || t;
  if (!t) return article;

  const properNouns = article.properNouns.some(
    (p) => linkKey(p) === linkKey(t),
  )
    ? article.properNouns
    : [...article.properNouns, t];

  const linkTitles = { ...(article.linkTitles ?? {}) };
  if (wikiTitle !== t) {
    linkTitles[t] = wikiTitle;
  } else {
    delete linkTitles[t];
  }

  return { ...article, properNouns, linkTitles };
}

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
    removeWikiMarkupFromText(text, entry.title, entry.term);

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

export function updateAutoLinkTitle(
  article: ArticleJson,
  term: string,
  title: string,
): ArticleJson {
  const t = term.trim();
  const wikiTitle = title.trim();
  const linkTitles = { ...(article.linkTitles ?? {}) };
  if (wikiTitle && wikiTitle !== t) {
    linkTitles[t] = wikiTitle;
  } else {
    delete linkTitles[t];
  }
  return {
    ...article,
    linkTitles: Object.keys(linkTitles).length ? linkTitles : undefined,
  };
}

export { wikiUrl };
