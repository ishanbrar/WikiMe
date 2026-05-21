import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import { resolveControversiesText } from "@/lib/intakeControversies";

const join = (items: string[], sep = " | ") =>
  items.map((s) => s.trim()).filter(Boolean).join(sep);

/** Per-field cap for compact JSON (full text still available in structured brief pass). */
const COMPACT_FIELD_MAX = 8000;

function compactFieldValue(text: string): string | string[] {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= COMPACT_FIELD_MAX) return t;
  const parts: string[] = [];
  for (let i = 0; i < t.length; i += COMPACT_FIELD_MAX) {
    parts.push(t.slice(i, i + COMPACT_FIELD_MAX));
  }
  return parts;
}

/** Compact intake for model prompts (fewer JSON tokens). */
export function compactIntakeForPrompt(
  intake: IntakeData,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {
    name: intake.fullName,
    title: intake.articleTitle,
    tone: intake.tone,
    len: intake.articleLength,
  };
  if (intake.birthplace) out.birth = intake.birthplace;
  if (intake.birthday) out.bday = intake.birthday;
  if (intake.deathDate) out.died = intake.deathDate;
  if (intake.currentLocation) out.loc = intake.currentLocation;
  if (intake.education) out.edu = intake.education;
  if (intake.occupation) out.job = intake.occupation;
  if (intake.achievements) {
    const ach = compactFieldValue(intake.achievements);
    if (typeof ach === "string") out.ach = ach;
    else out.ach_parts = ach;
  }
  if (intake.lifeEvents) {
    const life = compactFieldValue(intake.lifeEvents);
    if (typeof life === "string") out.life = life;
    else out.life_parts = life;
  }
  const controversies = resolveControversiesText(intake);
  if (controversies) {
    const c = compactFieldValue(controversies);
    if (typeof c === "string") out.controv = c;
    else out.controv_parts = c;
  }
  if (intake.extraNotes) {
    const notes = compactFieldValue(intake.extraNotes);
    if (typeof notes === "string") out.notes = notes;
    else out.notes_parts = notes;
  }
  const pasted = intake.pastedProfileText?.trim();
  if (pasted) {
    const p = compactFieldValue(pasted);
    if (typeof p === "string") out.paste = p;
    else out.paste_parts = p;
  }
  return out;
}

/** Compact extracted facts (omit empty fields). */
export function compactFactsForPrompt(
  facts: ExtractedProfileFacts,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (facts.detectedName) out.name = facts.detectedName;
  if (facts.headline) out.head = facts.headline;
  if (facts.bio) out.bio = facts.bio;
  if (facts.location) out.loc = facts.location;
  if (facts.education.length) out.edu = facts.education;
  if (facts.work.length) out.work = facts.work;
  if (facts.projects.length) out.proj = facts.projects;
  if (facts.skills.length) out.skills = facts.skills;
  if (facts.links.length) out.links = facts.links;
  if (facts.notableClaims.length) out.claims = facts.notableClaims;
  if (facts.rawUsefulText.length) {
    out.raw = facts.rawUsefulText;
  }
  return out;
}

export function buildCompactGenerationPayload(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  headshotUrl: string,
): string {
  return JSON.stringify({
    mode: intake.mode,
    i: compactIntakeForPrompt(intake),
    f: compactFactsForPrompt(facts),
    head: headshotUrl ? "yes" : "no",
  });
}

/** One-line editor notes for realism brief pass (not JSON). */
export function formatCompactIntakeLines(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): string {
  const lines: string[] = [];
  const i = compactIntakeForPrompt(intake);
  for (const [k, v] of Object.entries(i)) {
    if (Array.isArray(v)) {
      v.forEach((part, idx) => lines.push(`${k}[${idx + 1}]: ${part}`));
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  const f = compactFactsForPrompt(facts);
  if (f.work) lines.push(`work: ${join(f.work as string[])}`);
  if (f.edu) lines.push(`edu: ${join(f.edu as string[])}`);
  if (f.raw) lines.push(`screenshots: ${join(f.raw as string[])}`);
  return lines.join("\n");
}
