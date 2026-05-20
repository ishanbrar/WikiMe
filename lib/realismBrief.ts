import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import { resolveControversiesText } from "@/lib/intakeControversies";
import { generateText, TEXT_MODEL_REALISM } from "@/lib/gemini";

function formatIntakeForEditor(intake: IntakeData, facts: ExtractedProfileFacts): string {
  const lines: string[] = [
    `Full name: ${intake.fullName}`,
    `Article title: ${intake.articleTitle}`,
  ];
  if (intake.birthplace) lines.push(`Birthplace: ${intake.birthplace}`);
  if (intake.birthday) lines.push(`Birthday: ${intake.birthday}`);
  if (intake.deathDate) lines.push(`Death date: ${intake.deathDate}`);
  if (intake.currentLocation) lines.push(`Current location: ${intake.currentLocation}`);
  if (intake.education) lines.push(`Education: ${intake.education}`);
  if (intake.occupation) lines.push(`Occupation / roles: ${intake.occupation}`);
  if (intake.achievements) lines.push(`Achievements & skills: ${intake.achievements}`);
  if (intake.lifeEvents) lines.push(`Life events / family: ${intake.lifeEvents}`);
  if (intake.extraNotes) lines.push(`Extra notes: ${intake.extraNotes}`);
  const controversies = resolveControversiesText(intake);
  if (controversies) lines.push(`Controversies (must appear in article): ${controversies}`);
  if (intake.pastedProfileText?.trim()) {
    lines.push(`Pasted profile:\n${intake.pastedProfileText.slice(0, 3000)}`);
  }
  if (facts.detectedName || facts.headline || facts.bio) {
    lines.push(
      `Extracted from screenshots: name=${facts.detectedName ?? ""}; headline=${facts.headline ?? ""}; bio=${facts.bio ?? ""}`,
    );
  }
  if (facts.work?.length) lines.push(`Work history (extracted): ${facts.work.join("; ")}`);
  if (facts.education?.length) {
    lines.push(`Education (extracted): ${facts.education.join("; ")}`);
  }
  return lines.join("\n");
}

/** Pass 1: interpret messy intake into a normalized fact sheet (not article prose). */
export async function synthesizeRealismBrief(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): Promise<string> {
  const system = `You are a research editor preparing notes for a Wikipedia biographer.

Read the user's messy questionnaire and screenshot extracts. Output a structured FACT SHEET in plain English (not JSON).

Rules:
- Use bullet lists under headings: Identity, Family, Education, Career, Athletics and awards, Controversies (only if user supplied controversy material), Other
- Never drop controversy facts — copy every allegation, name, denial, and URL into Controversies bullets
- One discrete fact per bullet; deduplicate overlapping items across fields
- Fix obvious typos when meaning is clear (e.g. rbtother→brother, Indiciual→Individual, itern→intern, hpt→HPE, younga→younger, nikki→Nikki)
- Attribute facts correctly (father's squash career belongs under Family about the father, not as the subject's job)
- Normalize employers and schools to proper names (Boston College, Hewlett Packard Enterprise)
- Do NOT write encyclopedic paragraphs — only clear fact bullets
- Do NOT copy user sentences verbatim — rewrite each idea as a short neutral note
- Add a brief "Narrative thread" bullet list (2–4 items) under Identity: suggested chronological arc for the biographer (e.g. upbringing → education → career → athletics)`;

  const user = `Subject: ${intake.fullName}\nArticle length target: ${intake.articleLength}\n\n${formatIntakeForEditor(intake, facts)}`;

  return generateText(system, user, {
    model: TEXT_MODEL_REALISM,
    temperature: 0.25,
    maxTokens: 2200,
  });
}
