import type { ArticleJson, IntakeData } from "@/types/article";
import { normalizeInfobox } from "@/lib/infoboxHelpers";
import { buildMockArticle } from "@/lib/mockArticle";
import {
  applySupplementalPhotos,
  resolveFigureUrlsFromIndices,
  type SupplementalPhoto,
} from "@/lib/articleFigures";
import { stripQuestionsFromProse } from "@/lib/stripArticleQuestions";
import {
  normalizeWikiSections,
  parseSectionFromRaw,
} from "@/lib/wikiSections";

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter(Boolean);
}

export function articleWordCount(article: ArticleJson): number {
  const text = [
    ...article.summaryLead,
    ...article.sections.flatMap((s) => [
      ...s.paragraphs,
      ...(s.quotes?.flatMap((q) => [q.text, q.attribution]) ?? []),
      ...(s.subsections?.flatMap((sub) => sub.paragraphs) ?? []),
    ]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

export function normalizeArticleJson(
  raw: unknown,
  intake: IntakeData,
  headshotUrl: string,
  opts?: { creative?: boolean; supplementalPhotos?: SupplementalPhoto[] },
): ArticleJson {
  const fallback = buildMockArticle(intake, headshotUrl);
  const isCreative = opts?.creative ?? intake.mode === "creative";
  if (!raw || typeof raw !== "object") {
    return isCreative ? fallback : fallback;
  }

  const o = raw as Record<string, unknown>;
  const inf = (o.infobox as Record<string, unknown>) ?? {};

  const article: ArticleJson = {
    title: str(o.title, intake.articleTitle || intake.fullName),
    subtitle: str(o.subtitle, ""),
    summaryLead: strArr(o.summaryLead),
    infobox: normalizeInfobox(inf, intake, headshotUrl),
    sections: Array.isArray(o.sections)
      ? normalizeWikiSections(
          resolveFigureUrlsFromIndices(
            (o.sections as unknown[])
              .map((s) => parseSectionFromRaw(s as Record<string, unknown>))
              .filter((s): s is NonNullable<typeof s> => s !== null),
            opts?.supplementalPhotos ?? [],
          ),
          { creative: isCreative },
        )
      : [],
    seeAlso: strArr(o.seeAlso),
    references: Array.isArray(o.references)
      ? (o.references as unknown[]).map((r, i) => {
          const ref = r as Record<string, unknown>;
          const type = ref.type;
          const refType =
            type === "social-profile" || type === "external-link"
              ? type
              : "user-provided";
          return {
            label: str(ref.label, String(i + 1)),
            title: str(ref.title, "Reference"),
            url: typeof ref.url === "string" ? ref.url : null,
            type: refType as "user-provided" | "social-profile" | "external-link",
          };
        })
      : fallback.references,
    externalLinks: Array.isArray(o.externalLinks)
      ? (o.externalLinks as unknown[])
          .map((l) => {
            const link = l as Record<string, unknown>;
            return { label: str(link.label), url: str(link.url) };
          })
          .filter((l) => l.label && l.url)
      : [],
    properNouns: strArr(o.properNouns),
  };

  if (headshotUrl) article.infobox.imageUrl = headshotUrl;

  if (isCreative) {
    if (!article.summaryLead.length) {
      article.summaryLead = [
        `${intake.fullName} is a figure whose reputation has been described in divergent terms by admirers and skeptics alike.`,
        `The following account synthesizes widely circulated narratives associated with their public life.`,
      ];
    }
    if (!article.references.length) {
      article.references = [
        {
          label: "1",
          title: "Compiled narrative profile (creative mode)",
          url: null,
          type: "user-provided",
        },
      ];
    }
    return finishArticle(article, intake, opts?.supplementalPhotos);
  }

  if (!article.summaryLead.length) article.summaryLead = fallback.summaryLead;
  if (!article.sections.length) article.sections = fallback.sections;
  if (!article.references.length) article.references = fallback.references;

  return finishArticle(article, intake, opts?.supplementalPhotos);
}

function sanitizeArticleProse(article: ArticleJson): ArticleJson {
  return {
    ...article,
    summaryLead: article.summaryLead
      .map(stripQuestionsFromProse)
      .filter((p) => p.length > 0),
    sections: article.sections
      .map((sec) => ({
        ...sec,
        paragraphs: sec.paragraphs
          .map(stripQuestionsFromProse)
          .filter((p) => p.length > 0),
        quotes: sec.quotes
          ?.map((q) => ({
            ...q,
            text: stripQuestionsFromProse(q.text),
          }))
          .filter((q) => q.text.length > 0),
        subsections: sec.subsections
          ?.map((sub) => ({
            ...sub,
            paragraphs: sub.paragraphs
              .map(stripQuestionsFromProse)
              .filter((p) => p.length > 0),
          }))
          .filter((sub) => sub.paragraphs.length > 0),
      }))
      .filter(
        (sec) =>
          sec.paragraphs.length > 0 ||
          (sec.subsections?.length ?? 0) > 0 ||
          (sec.quotes?.length ?? 0) > 0 ||
          (sec.figures?.length ?? 0) > 0,
      ),
  };
}

function finishArticle(
  article: ArticleJson,
  intake: IntakeData,
  supplementalPhotos?: SupplementalPhoto[],
): ArticleJson {
  let result = sanitizeArticleProse(article);
  if (!supplementalPhotos?.length) return result;
  result = applySupplementalPhotos(
    result,
    supplementalPhotos,
    intake.fullName || intake.articleTitle,
  );
  return sanitizeArticleProse(result);
}
