import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import { resolveControversiesText } from "@/lib/intakeControversies";

const CHUNK_CHARS = 1800;

const FREE_FORM_DUMP_HINT = `Users may paste their entire biography, LinkedIn export, or resume into Additional info, Achievements, or Profile paste. Read every block below and assign facts to the correct biography categories (identity, education, career, family, athletics, controversies) even when labels are missing.`;

function chunkLines(label: string, text: string | undefined): string[] {
  const t = text?.trim();
  if (!t) return [];
  if (t.length <= CHUNK_CHARS) return [`${label}:\n${t}`];
  const out: string[] = [];
  for (let i = 0; i < t.length; i += CHUNK_CHARS) {
    const part = Math.floor(i / CHUNK_CHARS) + 1;
    const total = Math.ceil(t.length / CHUNK_CHARS);
    out.push(`${label} (part ${part}/${total}):\n${t.slice(i, i + CHUNK_CHARS)}`);
  }
  return out;
}

function line(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `${label}: ${v}` : null;
}

/** Total characters across all user-editable intake text (for token scaling). */
export function intakeTextVolume(intake: IntakeData): number {
  const keys: (keyof IntakeData)[] = [
    "fullName",
    "articleTitle",
    "birthplace",
    "birthday",
    "deathDate",
    "currentLocation",
    "education",
    "occupation",
    "achievements",
    "lifeEvents",
    "controversies",
    "extraNotes",
    "pastedProfileText",
  ];
  return keys.reduce((n, k) => n + String(intake[k] ?? "").length, 0);
}

/** Chunked, labeled intake for realism fact-sheet and long-context prompts. */
export function buildStructuredIntakeForBrief(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): string {
  const blocks: string[] = [];

  blocks.push("=== IDENTITY ===");
  for (const l of [
    line("full_name", intake.fullName),
    line("article_title", intake.articleTitle),
    line("mode", intake.mode),
    line("tone", intake.tone),
    line("length", intake.articleLength),
  ]) {
    if (l) blocks.push(l);
  }

  blocks.push("", "=== LOCATION & VITALS ===");
  for (const l of [
    line("birthplace", intake.birthplace),
    line("birthday", intake.birthday),
    line("death_date", intake.deathDate),
    line("current_location", intake.currentLocation),
  ]) {
    if (l) blocks.push(l);
  }

  blocks.push("", "=== EDUCATION & CAREER (structured fields) ===");
  for (const l of [
    line("education", intake.education),
    line("occupation", intake.occupation),
  ]) {
    if (l) blocks.push(l);
  }
  blocks.push(...chunkLines("achievements_and_skills", intake.achievements));

  blocks.push("", "=== LIFE, FAMILY & EVENTS ===");
  blocks.push(...chunkLines("life_events", intake.lifeEvents));

  const controversies = resolveControversiesText(intake);
  if (controversies) {
    blocks.push("", "=== CONTROVERSIES (user-supplied — do not drop) ===");
    blocks.push(...chunkLines("controversies", controversies));
  }

  blocks.push("", "=== FREE-FORM / ADDITIONAL INFO ===");
  blocks.push(FREE_FORM_DUMP_HINT);
  blocks.push(...chunkLines("additional_info", intake.extraNotes));
  blocks.push(...chunkLines("profile_paste", intake.pastedProfileText));

  if (facts.detectedName || facts.headline || facts.bio || facts.location) {
    blocks.push("", "=== SCREENSHOT / EXTRACTED FACTS ===");
    for (const l of [
      facts.detectedName ? `detected_name: ${facts.detectedName}` : null,
      facts.headline ? `headline: ${facts.headline}` : null,
      facts.bio ? `bio: ${facts.bio}` : null,
      facts.location ? `location: ${facts.location}` : null,
    ]) {
      if (l) blocks.push(l);
    }
    if (facts.education.length) {
      blocks.push(`education_extracted:\n${facts.education.map((e) => `- ${e}`).join("\n")}`);
    }
    if (facts.work.length) {
      blocks.push(`work_extracted:\n${facts.work.map((w) => `- ${w}`).join("\n")}`);
    }
    if (facts.notableClaims.length) {
      blocks.push(
        `claims_extracted:\n${facts.notableClaims.map((c) => `- ${c}`).join("\n")}`,
      );
    }
    for (const [i, raw] of facts.rawUsefulText.entries()) {
      blocks.push(...chunkLines(`screenshot_snippet_${i + 1}`, raw));
    }
  }

  return blocks.join("\n");
}

/** Token budget for realism fact-sheet pass from intake size. */
export function realismFactSheetMaxTokens(intake: IntakeData): number {
  const vol = intakeTextVolume(intake);
  if (vol > 14_000) return 4800;
  if (vol > 8000) return 4000;
  if (vol > 4000) return 3200;
  return 2600;
}

/** Token budget for realism article JSON pass. */
export function realismArticleMaxTokens(len: IntakeData["articleLength"]): number {
  if (len === "long") return 8192;
  if (len === "short") return 6000;
  return 7200;
}

/** Soft targets for retry prompts only — not enforced on save. */
export const REALISM_MIN_WORDS: Record<IntakeData["articleLength"], number> = {
  short: 180,
  standard: 260,
  long: 380,
};

const CREATIVE_MIN_WORDS_BASE: Record<IntakeData["articleLength"], number> = {
  short: 700,
  standard: 1400,
  long: 2400,
};

const CREATIVE_MIN_WORDS_SPARSE: Record<IntakeData["articleLength"], number> = {
  short: 360,
  standard: 480,
  long: 680,
};

/** Characters across extracted screenshot / profile facts. */
export function extractedFactsTextVolume(facts: ExtractedProfileFacts): number {
  let n = 0;
  n += String(facts.detectedName ?? "").length;
  n += String(facts.headline ?? "").length;
  n += String(facts.bio ?? "").length;
  n += String(facts.location ?? "").length;
  for (const s of facts.education) n += String(s).length;
  for (const s of facts.work) n += String(s).length;
  for (const s of facts.projects) n += String(s).length;
  for (const s of facts.skills) n += String(s).length;
  for (const s of facts.links) n += String(s).length;
  for (const s of facts.notableClaims) n += String(s).length;
  for (const s of facts.rawUsefulText) n += String(s).length;
  return n;
}

export function generationSourceVolume(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): number {
  return intakeTextVolume(intake) + extractedFactsTextVolume(facts);
}

/**
 * True when questionnaire + extracted profile text is still small.
 * Screenshots with rich extracts raise this above the threshold so we keep full length targets.
 */
export const SPARSE_GENERATION_CHAR_THRESHOLD = 1800;

export function isSparseGenerationInput(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): boolean {
  return generationSourceVolume(intake, facts) < SPARSE_GENERATION_CHAR_THRESHOLD;
}

/** Realism retry threshold — reduced when the biography payload is tiny. */
export function realismMinWordsForIntake(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): number {
  const base = REALISM_MIN_WORDS[intake.articleLength];
  if (!isSparseGenerationInput(intake, facts)) return base;
  return Math.max(120, Math.floor(base * 0.62));
}

/** Creative retry threshold — heavy defaults are unrealistic for a one-line bio. */
export function creativeMinWordsForIntake(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): number {
  return isSparseGenerationInput(intake, facts)
    ? CREATIVE_MIN_WORDS_SPARSE[intake.articleLength]
    : CREATIVE_MIN_WORDS_BASE[intake.articleLength];
}
