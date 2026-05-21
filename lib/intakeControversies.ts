import type { IntakeData } from "@/types/article";

const CONTROVERSY_MARKERS = [
  /controversies\s*section\s*:/i,
  /controversies\s*:/i,
  /controver(?:sy|sies)\s*:/i,
  /contr[o0]?versies\s*:/i,
  /conroversies\s*:/i,
  /contrversies\s*:/i,
  /contrver?sies\s*:/i,
  /^\s*##\s*controversies/i,
];

/** Pull labeled controversy blocks out of freeform intake text. */
export function peelControversiesBlock(text: string): {
  cleaned: string;
  extracted: string;
} {
  const raw = text.trim();
  if (!raw) return { cleaned: "", extracted: "" };

  for (const marker of CONTROVERSY_MARKERS) {
    const match = raw.match(marker);
    if (!match || match.index === undefined) continue;
    const start = match.index + match[0].length;
    let rest = raw.slice(start).trim();
    const nextSection = rest.search(
      /\n\s*(?:[A-Z][A-Z\s]{2,}\s*SECTION\s*:|##\s+[A-Z])/,
    );
    const extracted =
      nextSection === -1 ? rest : rest.slice(0, nextSection).trim();
    const cleaned = (
      raw.slice(0, match.index).trim() +
      (nextSection === -1 ? "" : rest.slice(nextSection))
    ).trim();
    if (extracted) return { cleaned, extracted };
  }

  return { cleaned: raw, extracted: "" };
}

const INTAKE_TEXT_KEYS = [
  "extraNotes",
  "lifeEvents",
  "achievements",
  "pastedProfileText",
] as const;

/** Merge dedicated field + legacy labeled blocks from other intake fields. */
export function resolveControversiesText(intake: IntakeData): string {
  const parts: string[] = [];
  if (intake.controversies?.trim()) parts.push(intake.controversies.trim());

  for (const key of INTAKE_TEXT_KEYS) {
    const value = intake[key];
    if (!value?.trim()) continue;
    const { extracted } = peelControversiesBlock(value);
    if (extracted) parts.push(extracted);
  }

  return parts.join("\n\n").trim();
}

export function hasControversiesContent(intake: IntakeData): boolean {
  return resolveControversiesText(intake).length > 0;
}

/** Extract http(s) URLs from controversy notes for references. */
export function controversyReferenceUrls(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s)\]"']+/gi) ?? [];
  return [...new Set(urls.map((u) => u.replace(/[.,;]+$/, "")))];
}

/** Normalize intake object from API/drafts: populate controversies, strip dupes from other fields. */
export function enrichIntakeControversies(
  o: Record<string, unknown>,
): Record<string, unknown> {
  let controversies =
    typeof o.controversies === "string" ? o.controversies.trim() : "";
  const out = { ...o };

  for (const key of INTAKE_TEXT_KEYS) {
    const value = typeof out[key] === "string" ? (out[key] as string) : "";
    if (!value.trim()) continue;
    const { cleaned, extracted } = peelControversiesBlock(value);
    if (extracted) {
      controversies = controversies
        ? `${controversies}\n\n${extracted}`
        : extracted;
      out[key] = cleaned;
    }
  }

  if (controversies) out.controversies = controversies;
  else if (typeof out.controversies !== "string") out.controversies = "";

  return out;
}
