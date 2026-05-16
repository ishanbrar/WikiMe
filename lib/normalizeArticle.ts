import type { ArticleJson, IntakeData } from "@/types/article";
import { buildMockArticle } from "@/lib/mockArticle";

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
    ...article.sections.flatMap((s) => s.paragraphs),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

export function normalizeArticleJson(
  raw: unknown,
  intake: IntakeData,
  headshotUrl: string,
  opts?: { creative?: boolean },
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
    infobox: {
      name: str(inf.name, intake.fullName),
      imageUrl: str(inf.imageUrl, headshotUrl),
      caption: str(inf.caption, ""),
      born: str(inf.born, ""),
      hometown: str(inf.hometown, intake.birthplace),
      currentLocation: str(inf.currentLocation, intake.currentLocation),
      education: str(inf.education, intake.education),
      occupation: str(inf.occupation, intake.occupation),
      yearsActive: str(inf.yearsActive, ""),
      knownFor: strArr(inf.knownFor),
      notableWorks: strArr(inf.notableWorks),
      awards: strArr(inf.awards),
      socialLinks: Array.isArray(inf.socialLinks)
        ? (inf.socialLinks as unknown[])
            .map((l) => {
              const link = l as Record<string, unknown>;
              return {
                label: str(link.label),
                url: str(link.url),
              };
            })
            .filter((l) => l.label && l.url)
        : [],
    },
    sections: Array.isArray(o.sections)
      ? (o.sections as unknown[])
          .map((s) => {
            const sec = s as Record<string, unknown>;
            return {
              id: str(sec.id, "section"),
              title: str(sec.title, "Section"),
              paragraphs: strArr(sec.paragraphs),
            };
          })
          .filter((s) => s.paragraphs.length > 0)
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
    return article;
  }

  if (!article.summaryLead.length) article.summaryLead = fallback.summaryLead;
  if (!article.sections.length) article.sections = fallback.sections;
  if (!article.references.length) article.references = fallback.references;

  return article;
}
