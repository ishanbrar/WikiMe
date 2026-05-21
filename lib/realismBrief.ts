import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import {
  buildStructuredIntakeForBrief,
  realismFactSheetMaxTokens,
} from "@/lib/structuredIntakeForPrompt";
import { generateText, TEXT_MODEL_REALISM } from "@/lib/gemini";

/** Pass 1: interpret messy intake into a normalized fact sheet (not article prose). */
export async function synthesizeRealismBrief(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
): Promise<string> {
  const system = `You are a research editor preparing notes for a Wikipedia biographer.

Read the user's messy questionnaire and screenshot extracts. Output a structured FACT SHEET in plain English (not JSON).

Rules:
- Use bullet lists under headings: Identity, Family, Education, Career, Athletics and awards, Controversies (only if user supplied controversy material), Other
- Users may dump their entire biography into one free-form field — read ALL labeled blocks and sort facts into the correct headings
- Never drop controversy facts — copy every allegation, name, denial, and URL into Controversies bullets
- One discrete fact per bullet; deduplicate overlapping items across fields
- Fix obvious typos when meaning is clear (e.g. rbtother→brother, Indiciual→Individual, itern→intern, hpt→HPE, younga→younger, nikki→Nikki, CONTRVERsIES→controversies)
- Attribute facts correctly (father's squash career belongs under Family about the father, not as the subject's job)
- Normalize employers and schools to proper names (Boston College, Hewlett Packard Enterprise)
- Do NOT write encyclopedic paragraphs — only clear fact bullets
- Do NOT copy user sentences verbatim — rewrite each idea as a short neutral note
- Add a brief "Narrative thread" bullet list (2–4 items) under Identity: suggested chronological arc for the biographer (e.g. upbringing → education → career → athletics)`;

  const user = `Subject: ${intake.fullName}\nLength: ${intake.articleLength}\n\n${buildStructuredIntakeForBrief(intake, facts)}`;

  return generateText(system, user, {
    model: TEXT_MODEL_REALISM,
    temperature: 0.25,
    maxTokens: realismFactSheetMaxTokens(intake),
  });
}
