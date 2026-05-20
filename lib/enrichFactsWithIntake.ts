import type { ExtractedProfileFacts, IntakeData } from "@/types/article";

/** Merge questionnaire fields into facts so first generate has full context without extract. */
export function enrichFactsWithIntake(
  facts: ExtractedProfileFacts,
  intake: IntakeData,
): ExtractedProfileFacts {
  const out: ExtractedProfileFacts = {
    ...facts,
    education: [...facts.education],
    work: [...facts.work],
    projects: [...facts.projects],
    skills: [...facts.skills],
    links: [...facts.links],
    notableClaims: [...facts.notableClaims],
    rawUsefulText: [...facts.rawUsefulText],
  };

  if (!out.detectedName?.trim()) out.detectedName = intake.fullName.trim() || null;
  if (!out.location?.trim() && intake.currentLocation?.trim()) {
    out.location = intake.currentLocation.trim();
  }
  if (!out.bio?.trim() && intake.extraNotes?.trim()) {
    out.bio = intake.extraNotes.trim().slice(0, 2000);
  }

  const pushUnique = (arr: string[], value: string | undefined) => {
    const v = value?.trim();
    if (!v) return;
    if (!arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v);
  };

  pushUnique(out.education, intake.education);
  pushUnique(out.work, intake.occupation);
  pushUnique(out.notableClaims, intake.achievements);
  pushUnique(out.notableClaims, intake.lifeEvents);

  if (intake.pastedProfileText?.trim()) {
    pushUnique(out.rawUsefulText, intake.pastedProfileText.trim().slice(0, 4000));
  }

  const intakeBlob = [
    intake.achievements,
    intake.lifeEvents,
    intake.occupation,
    intake.education,
    intake.extraNotes,
  ]
    .filter(Boolean)
    .join("\n");
  if (intakeBlob.trim()) {
    pushUnique(out.rawUsefulText, intakeBlob.slice(0, 4000));
  }

  return out;
}
