import type { ArticleJson } from "@/types/article";

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

export function isRegurgitatedRealism(article: ArticleJson): boolean {
  const blob = [
    ...article.summaryLead,
    ...article.sections.flatMap((s) => [
      ...s.paragraphs,
      ...(s.subsections?.flatMap((sub) => sub.paragraphs) ?? []),
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return REALISM_REGURGITATION_MARKERS.some((m) => blob.includes(m));
}
