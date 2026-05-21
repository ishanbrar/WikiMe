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
  const pushUnique = (arr: string[], value: string | undefined) => {
    const v = value?.trim();
    if (!v) return;
    if (!arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v);
  };

  const pushRawChunks = (text: string | undefined, label: string) => {
    const t = text?.trim();
    if (!t) return;
    const chunkSize = 3500;
    if (t.length <= chunkSize) {
      pushUnique(out.rawUsefulText, t);
      return;
    }
    for (let i = 0; i < t.length; i += chunkSize) {
      pushUnique(out.rawUsefulText, `${label}:\n${t.slice(i, i + chunkSize)}`);
    }
  };

  if (!out.bio?.trim()) {
    const bioSource =
      intake.extraNotes?.trim() ||
      intake.pastedProfileText?.trim()?.slice(0, 2000) ||
      "";
    if (bioSource) out.bio = bioSource.slice(0, 2000);
  }

  pushUnique(out.education, intake.education);
  pushUnique(out.work, intake.occupation);
  pushUnique(out.notableClaims, intake.achievements);
  pushUnique(out.notableClaims, intake.lifeEvents);

  pushRawChunks(intake.pastedProfileText, "profile_paste");
  pushRawChunks(intake.extraNotes, "additional_info");
  pushRawChunks(intake.achievements, "achievements");
  pushRawChunks(intake.lifeEvents, "life_events");
  pushRawChunks(intake.controversies, "controversies");

  return out;
}
