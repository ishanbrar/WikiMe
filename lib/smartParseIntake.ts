import type { IntakeData } from "@/types/article";

export type IntakeSmartParse = Partial<
  Pick<
    IntakeData,
    | "fullName"
    | "articleTitle"
    | "birthplace"
    | "birthday"
    | "currentLocation"
    | "education"
    | "occupation"
    | "achievements"
    | "lifeEvents"
    | "controversies"
  >
>;

function clean(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim().replace(/[.;,]+$/g, "") ?? "";
}

function first(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = clean(match?.[1]);
    if (value) return value;
  }
  return "";
}

export function smartParseIntakeText(text: string): IntakeSmartParse {
  const t = text.trim();
  if (!t) return {};

  const name = first(t, [
    /\bName\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})\b/,
    /\b([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){1,3})\s+(?:is|was)\b/,
  ]);
  const birthday = first(t, [
    /\bBorn\s+([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})\b/i,
    /\bborn\s+(?:on\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/i,
  ]);
  const birthplace = first(t, [
    /\bBorn\s+[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}\s+in\s+([^.\n]+?)(?:\.| Hometown| Nationality| Current| Education|$)/i,
    /\bborn\s+(?:on\s+)?[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}\s+in\s+([^.\n]+?)(?:\.| Hometown| Nationality| Current| Education|$)/i,
    /\bHometown\s+(?:is\s+)?([^.\n]+?)(?:\.| Nationality| Current| Education|$)/i,
  ]);
  const currentLocation = first(t, [
    /\bCurr?er?nt location\s+(?:is\s+)?([^.\n]+?)(?:\.| Education| Currently|$)/i,
    /\bbased in\s+([^.\n]+?)(?:\.|,|$)/i,
  ]);
  const educationBits = [
    first(t, [
      /\bEducation\s+([^.\n]+?)(?:\.| Currently| CONTROVERSY|$)/i,
      /\b(BS|BA|B\.S\.|B\.A\.|MS|M\.S\.|PhD|M\.D\.)\s+[^.\n]+?(?:from|at)\s+[^.\n]+/i,
    ]),
    first(t, [
      /\bCurrently\s+(?:a\s+)?([^.\n]+?school[^.\n]+?)(?:\.| CONTROVERSY|$)/i,
    ]),
  ].filter(Boolean);
  const controversies = first(t, [
    /\bCONTROVERSY:\s*([\s\S]+?)(?:\[\s*AI MODEL|\bSeveral publications\b|$)/i,
  ]);
  const achievements = [
    first(t, [
      /\b(Several publications[\s\S]+?)(?=\bIn a relationship\b|$)/i,
    ]),
    first(t, [
      /\b(winning\s+[^.\n]+championship[^.\n]*)(?:\.|$)/i,
    ]),
  ].filter(Boolean);
  const lifeEvents = [
    first(t, [
      /\b(In a relationship[\s\S]+?)(?=\bShe was\b|\bBorn in\b|$)/i,
    ]),
    first(t, [
      /\b(Born in[\s\S]+?)(?=\bMoved\b|$)/i,
    ]),
    first(t, [
      /\b(Moved to[\s\S]+?)(?=\bFather\b|$)/i,
    ]),
    first(t, [
      /\b(They have a [^.\n]+)/i,
    ]),
  ].filter(Boolean);

  const out: IntakeSmartParse = {};
  if (name) {
    out.fullName = name;
    out.articleTitle = name;
  }
  if (birthday) out.birthday = birthday;
  if (birthplace) out.birthplace = birthplace;
  if (currentLocation) out.currentLocation = currentLocation;
  if (educationBits.length) out.education = educationBits.join("; ");
  if (/medical student|founder|engineer|designer|researcher/i.test(t)) {
    out.occupation = first(t, [
      /\b(?:is|as)\s+(?:an?\s+)?([^.\n]+?(?:student|founder|engineer|designer|researcher)[^.\n]*)(?:\.|,|$)/i,
      /\bCurrently\s+(?:a\s+)?([^.\n]+?student[^.\n]*)(?:\.|$)/i,
    ]);
  }
  if (controversies) out.controversies = controversies;
  if (achievements.length) out.achievements = achievements.join("\n");
  if (lifeEvents.length) out.lifeEvents = lifeEvents.join("\n");
  return out;
}

export function smartParseIntake(intake: IntakeData): IntakeSmartParse {
  return smartParseIntakeText(
    [intake.extraNotes, intake.pastedProfileText, intake.achievements, intake.lifeEvents]
      .filter(Boolean)
      .join("\n"),
  );
}

export function mergeSmartParseIntoIntake(
  intake: IntakeData,
  parsed: IntakeSmartParse,
): IntakeData {
  const next = { ...intake };
  for (const [key, value] of Object.entries(parsed) as Array<
    [keyof IntakeSmartParse, string | undefined]
  >) {
    if (!value?.trim()) continue;
    if (String(next[key] ?? "").trim()) continue;
    next[key] = value as never;
  }
  return next;
}
