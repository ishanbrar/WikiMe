import type { IntakeData } from "@/types/article";

/** True when article title should follow full name (empty or still mirrors previous name). */
export function shouldSyncArticleTitle(
  articleTitle: string,
  previousFullName: string,
): boolean {
  const title = articleTitle.trim();
  const prev = previousFullName.trim();
  return !title || title === prev;
}

export function applyFullNameChange(
  value: IntakeData,
  nextFullName: string,
): IntakeData {
  const next: IntakeData = { ...value, fullName: nextFullName };
  if (shouldSyncArticleTitle(value.articleTitle, value.fullName)) {
    next.articleTitle = nextFullName;
  }
  return next;
}
