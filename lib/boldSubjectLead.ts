/** Split text so the first occurrence of the subject name can render bold (Wikipedia lead). */

export type SubjectNameBoldSplit = {
  before: string;
  name: string;
  after: string;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitAtNameInText(text: string, name: string): SubjectNameBoldSplit | null {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const re = new RegExp(`^${escapeRegExp(trimmedName)}`, "i");
  const m = text.match(re);
  if (!m) return null;

  const len = m[0].length;
  return {
    before: text.slice(0, 0),
    name: text.slice(0, len),
    after: text.slice(len),
  };
}

/** "Ishan Brar" → match "Ishan Singh Brar" at lead start. */
function splitMiddleNameVariant(
  text: string,
  subjectName: string,
): SubjectNameBoldSplit | null {
  const parts = subjectName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;

  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const re = new RegExp(
    `^(${escapeRegExp(first)}\\s+\\S+\\s+${escapeRegExp(last)})`,
    "i",
  );
  const m = text.match(re);
  if (!m?.[1]) return null;

  const name = m[1];
  return { before: "", name, after: text.slice(name.length) };
}

/** Wikipedia biographies: bold the name before "(born …)" or "is an/a …". */
function splitWikipediaLeadPatterns(text: string): SubjectNameBoldSplit | null {
  const born = text.match(/^(.+?)\s*\(\s*born\b/i);
  if (born?.[1]) {
    const name = born[1].trim();
    if (name.length >= 2 && name.length <= 120) {
      const idx = text.indexOf(name);
      if (idx !== -1) {
        return {
          before: text.slice(0, idx),
          name,
          after: text.slice(idx + name.length),
        };
      }
    }
  }

  const isAn = text.match(/^(.+?)\s+is\s+(?:an|a)\s+/i);
  if (isAn?.[1]) {
    const name = isAn[1].trim();
    if (name.length >= 2 && name.length <= 120 && !name.includes(".")) {
      const idx = text.indexOf(name);
      if (idx !== -1) {
        return {
          before: text.slice(0, idx),
          name,
          after: text.slice(idx + name.length),
        };
      }
    }
  }

  return null;
}

export function splitSubjectNameBold(
  text: string,
  subjectName: string,
  articleTitle?: string,
  infoboxName?: string,
): SubjectNameBoldSplit | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const wikiPattern = splitWikipediaLeadPatterns(trimmed);
  if (wikiPattern) return wikiPattern;

  const candidates = [
    infoboxName?.trim(),
    subjectName.trim(),
    articleTitle?.trim(),
  ].filter((n): n is string => Boolean(n && n.length > 0));

  const unique = [...new Set(candidates)].sort((a, b) => b.length - a.length);

  for (const name of unique) {
    const hit = splitAtNameInText(trimmed, name);
    if (hit) return hit;
  }

  return splitMiddleNameVariant(trimmed, subjectName);
}
