import type { ArticleJson, IntakeData } from "@/types/article";

/** Phrases that indicate intake was pasted instead of encyclopedic writing. */
export const REALISM_REGURGITATION_MARKERS = [
  "according to user-provided information",
  "occupation and role are described as",
  "additional interests and skills noted by the subject include",
  "'s education includes",
  "education includes",
  "this article summarizes user-provided",
  "documented in this user-generated profile",
  "biographical article (demo mode)",
  "is associated with",
] as const;

export const REALISM_PROSE_RULES = `REALISM WRITING (required):
- Use the JSON inputs only as source facts. Rewrite everything into original third-person encyclopedic prose — never paste, quote, or lightly rephrase intake strings.
- FORBIDDEN: "is associated with", "education includes", "occupation and role are described as", "according to user-provided", "noted by the subject include", "This article summarizes", listing comma-separated intake in one sentence, or repeating the user's exact wording.
- REQUIRED STYLE: Wikipedia biography voice — neutral, declarative, varied sentence openings. Use "was born", "grew up in", "attended", "studied", "worked as", "competed as", "was named", etc.
- summaryLead: 2–3 sentences in classic lead style (identity, origin/education, career or distinction). No meta text about how the article was written.
- Each section: at least 2 substantive sentences that weave multiple facts (chronology, context, relationships). Split career vs athletics vs personal life logically.
- Fix obvious typos in source data when meaning is clear (e.g. itern→intern, hpt→HPE). Do not invent employers, degrees, awards, or dates not supported by the inputs.
- achievements, sports, and awards belong in career or their own section — not as a raw list in personal life.`;

export const REALISM_REGURGITATION_RETRY_NOTE = `CRITICAL: Your previous draft repeated user intake verbatim. Rewrite completely in original Wikipedia prose. Do not use any forbidden template phrases from the realism rules.`;

function normalizeForOverlap(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** True if a long chunk of intake text appears verbatim in the article. */
function overlapsIntakeVerbatim(blob: string, intake: IntakeData): boolean {
  const fields = [
    intake.achievements,
    intake.lifeEvents,
    intake.occupation,
    intake.education,
    intake.extraNotes,
    intake.pastedProfileText,
  ].filter((f): f is string => Boolean(f?.trim()));

  for (const field of fields) {
    const normalized = normalizeForOverlap(field);
    const clauses = normalized.split(/[.!?]+/).map((c) => c.trim()).filter((c) => c.length >= 18);
    for (const clause of clauses) {
      if (blob.includes(clause)) return true;
    }
    if (normalized.length >= 24 && blob.includes(normalized.slice(0, Math.min(48, normalized.length)))) {
      return true;
    }
  }

  const name = intake.fullName.trim();
  if (name.length >= 4) {
    const re = new RegExp(
      `${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^.]{0,40}${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    );
    if (re.test(blob.replace(/\s+/g, " "))) return true;
  }

  return false;
}

function hasDuplicateSectionText(article: ArticleJson): boolean {
  const bodies = article.sections.map((s) =>
    normalizeForOverlap(s.paragraphs.join(" ")),
  );
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      if (bodies[i].length < 80 || bodies[j].length < 80) continue;
      if (bodies[i] === bodies[j]) return true;
      if (bodies[i].includes(bodies[j].slice(0, 120))) return true;
    }
  }
  return false;
}

export function isRegurgitatedRealism(
  article: ArticleJson,
  intake?: IntakeData,
): boolean {
  const blob = normalizeForOverlap(
    [
      ...article.summaryLead,
      ...article.sections.flatMap((s) => [
        ...s.paragraphs,
        ...(s.subsections?.flatMap((sub) => sub.paragraphs) ?? []),
      ]),
    ].join(" "),
  );

  if (REALISM_REGURGITATION_MARKERS.some((m) => blob.includes(m))) return true;
  if (intake && overlapsIntakeVerbatim(blob, intake)) return true;
  if (hasDuplicateSectionText(article)) return true;
  return false;
}
