import type { ArticleJson, IntakeData } from "@/types/article";
import type { LinkExtractionStatus } from "@/lib/linkExtraction";

function articleText(article: ArticleJson): string {
  return [
    article.title,
    ...article.summaryLead,
    ...article.sections.flatMap((s) => [
      s.title,
      ...s.paragraphs,
      ...(s.subsections ?? []).flatMap((sub) => [sub.title, ...sub.paragraphs]),
    ]),
  ]
    .join("\n")
    .toLowerCase();
}

function sectionLike(article: ArticleJson, pattern: RegExp): boolean {
  return article.sections.some((s) => pattern.test(`${s.id} ${s.title}`));
}

export function articleCompletenessWarnings({
  article,
  intake,
  expectedExtraPhotos = 0,
  linkStatuses = [],
}: {
  article: ArticleJson;
  intake: IntakeData;
  expectedExtraPhotos?: number;
  linkStatuses?: LinkExtractionStatus[];
}): string[] {
  const warnings: string[] = [];
  const text = articleText(article);

  if (intake.education.trim() && !sectionLike(article, /education|early/i)) {
    warnings.push("Education details were provided, but no Education section was created.");
  }
  if (
    intake.achievements.trim() &&
    /publication|journal|research|award|championship/i.test(intake.achievements) &&
    !/publication|journal|research|award|championship/.test(text)
  ) {
    warnings.push("Achievements or publications were provided but look thin in the article.");
  }
  if (intake.controversies.trim() && !sectionLike(article, /controvers/i)) {
    warnings.push("Controversy details were provided, but no Controversies section was created.");
  }
  if (intake.lifeEvents.trim() && !sectionLike(article, /personal|life|early/i)) {
    warnings.push("Personal-life details were provided, but no matching section was created.");
  }

  const placedExtraPhotos = article.sections.reduce(
    (sum, section) => sum + (section.figures?.length ?? 0),
    0,
  );
  if (expectedExtraPhotos > 0 && placedExtraPhotos < expectedExtraPhotos) {
    warnings.push(
      `${expectedExtraPhotos} photo(s) uploaded but ${placedExtraPhotos} placed in the article.`,
    );
  }

  const skippedLinks = linkStatuses.filter(
    (s) => !["fetched", "pdf"].includes(s.status),
  ).length;
  if (skippedLinks > 0) {
    warnings.push(`${skippedLinks} linked source(s) could not be read.`);
  }

  if (article.sections.length === 0) {
    warnings.push("The article has no body sections beyond the lead.");
  }

  return warnings;
}
