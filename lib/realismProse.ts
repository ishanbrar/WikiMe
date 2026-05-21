import type { ArticleJson, IntakeData } from "@/types/article";

/** Phrases that indicate intake was pasted instead of encyclopedic writing. */
/** Sentence patterns from demo/fallback builders — must never appear in AI realism output. */
/** Phrases produced only by demo/mock builders — not normal Wikipedia prose. */
export const REALISM_MOCK_TEMPLATE_MARKERS = [
  "has worked in roles including",
  "whose biography is documented below",
  "is an individual based in",
  "is an individual whose biography",
  "outside of their professional activities, limited personal details",
] as const;

export const REALISM_REGURGITATION_MARKERS = [
  "according to user-provided information",
  "occupation and role are described as",
  "additional interests and skills noted by the subject include",
  "this article summarizes user-provided",
  "documented in this user-generated profile",
  "biographical article (demo mode)",
  "is associated with",
] as const;

export const REALISM_PROSE_RULES = `REALISM WRITING (required):
- Use the JSON inputs only as source facts. Rewrite everything into original third-person encyclopedic prose — never paste, quote, or lightly rephrase intake strings.
- FORBIDDEN: "is associated with", "education includes", "occupation and role are described as", "according to user-provided", "noted by the subject include", "This article summarizes", listing comma-separated intake in one sentence, or repeating the user's exact wording.
- FORBIDDEN STRUCTURE: Do not write one isolated sentence per intake field. No staccato résumé lines like "X was born in Y. X attended Z. X works at W." with no connection between them.

NARRATIVE FLOW (like a real Wikipedia biography):
- Write cohesive paragraphs: each paragraph should read as a small story arc (background → development → outcome), not a bullet list turned into sentences.
- Link facts with natural transitions: "After graduating from…", "During his time at…", "While working at…", "In parallel with…", "Following this…", "He later…", "By [year]…", "Subsequently…", "In addition to…".
- Vary sentence length and openings; alternate short factual statements with longer sentences that combine related details.
- Use pronouns or surname after the subject is introduced in a section — do not begin every sentence with the full name.
- Objective, neutral tone: report what happened without hype, marketing, or editorializing. Prefer "has been described as" or "according to…" only when the source material is uncertain — otherwise state facts plainly.
- summaryLead: 2–3 flowing sentences in classic Wikipedia lead style (who they are, formative background, current role or notability). Sentences should connect logically, not read as three unrelated facts.
- Each section: 2–4 paragraphs when material allows; each paragraph 3–5 sentences that weave multiple related facts (chronology, cause and effect, family context, institution names).
- Split career, education, athletics, and personal life logically; within a section, order events chronologically where possible.
- Fix obvious typos in source data when meaning is clear (e.g. itern→intern, hpt→HPE). Do not invent employers, degrees, awards, or dates not supported by the inputs.
- achievements, sports, and awards belong in career or their own section — not as a raw list in personal life.`;

export const REALISM_REGURGITATION_RETRY_NOTE = `CRITICAL: Your previous draft repeated user intake verbatim or read like disconnected one-line facts. Rewrite completely in flowing Wikipedia prose with transitions between sentences. Do not use any forbidden template phrases from the realism rules.`;

function normalizeForOverlap(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** True when ≥minWords consecutive words from source appear in order in the article. */
function hasLongVerbatimWordRun(
  blob: string,
  source: string,
  minWords: number,
): boolean {
  const words = normalizeForOverlap(source)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length < minWords) return false;
  for (let i = 0; i <= words.length - minWords; i++) {
    const phrase = words.slice(i, i + minWords).join(" ");
    if (phrase.length >= 40 && blob.includes(phrase)) return true;
  }
  return false;
}

/** Long LinkedIn/resume dumps — allow shared phrases; only flag near-full paste. */
const LONG_INTAKE_FIELD_CHARS = 700;
const LONG_FIELD_MIN_VERBATIM_WORDS = 22;
const SHORT_FIELD_MIN_VERBATIM_WORDS = 12;

/** True if intake was pasted wholesale (not merely the same facts rephrased). */
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
    if (normalized.length < 50) continue;

    const isLongDump = field.trim().length >= LONG_INTAKE_FIELD_CHARS;
    const minWords = isLongDump
      ? LONG_FIELD_MIN_VERBATIM_WORDS
      : SHORT_FIELD_MIN_VERBATIM_WORDS;

    if (isLongDump) {
      if (normalized.length >= 200 && blob.includes(normalized)) return true;
      if (hasLongVerbatimWordRun(blob, field, minWords)) return true;
      continue;
    }

    if (blob.includes(normalized)) return true;
    if (hasLongVerbatimWordRun(blob, field, minWords)) return true;
  }

  for (const field of fields) {
    if (field.trim().length >= LONG_INTAKE_FIELD_CHARS) continue;
    const normalized = normalizeForOverlap(field);
    const clauses = normalized
      .split(/[.!?;]+/)
      .map((c) => c.trim())
      .filter((c) => c.length >= 45);
    for (const clause of clauses) {
      if (blob.includes(clause)) return true;
    }
  }

  return false;
}

function hasDuplicateSectionText(article: ArticleJson): boolean {
  const bodies = article.sections.map((s) =>
    normalizeForOverlap(s.paragraphs.join(" ")),
  );
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      if (bodies[i].length < 120 || bodies[j].length < 120) continue;
      if (bodies[i] === bodies[j]) return true;
      if (
        bodies[i].length > 200 &&
        bodies[j].length > 200 &&
        bodies[i].includes(bodies[j].slice(0, 200))
      ) {
        return true;
      }
    }
  }
  return false;
}

export function hasMockTemplateProse(article: ArticleJson): boolean {
  const blob = normalizeForOverlap(
    [
      ...article.summaryLead,
      ...article.sections.flatMap((s) => s.paragraphs),
    ].join(" "),
  );
  return REALISM_MOCK_TEMPLATE_MARKERS.some((m) => blob.includes(m));
}

export function realismQualityIssue(
  article: ArticleJson,
  intake?: IntakeData,
): "mock_template" | "forbidden_phrase" | "verbatim_paste" | "duplicate_sections" | null {
  if (hasMockTemplateProse(article)) return "mock_template";

  const blob = normalizeForOverlap(
    [
      ...article.summaryLead,
      ...article.sections.flatMap((s) => [
        ...s.paragraphs,
        ...(s.subsections?.flatMap((sub) => sub.paragraphs) ?? []),
      ]),
    ].join(" "),
  );

  if (REALISM_REGURGITATION_MARKERS.some((m) => blob.includes(m))) {
    return "forbidden_phrase";
  }
  if (intake && overlapsIntakeVerbatim(blob, intake)) return "verbatim_paste";
  if (hasDuplicateSectionText(article)) return "duplicate_sections";
  return null;
}

export function isRegurgitatedRealism(
  article: ArticleJson,
  intake?: IntakeData,
): boolean {
  return realismQualityIssue(article, intake) !== null;
}

/** Human-readable hint for retry prompts / logs. */
export function realismQualityIssueMessage(
  issue: NonNullable<ReturnType<typeof realismQualityIssue>>,
): string {
  switch (issue) {
    case "mock_template":
      return "Output used demo-template phrasing.";
    case "forbidden_phrase":
      return "Output used forbidden meta-intake phrasing.";
    case "verbatim_paste":
      return "Output pasted long stretches of user intake verbatim.";
    case "duplicate_sections":
      return "Two sections repeated the same paragraphs.";
    default:
      return "Quality check failed.";
  }
}
