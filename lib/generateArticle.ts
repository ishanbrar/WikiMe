import type {
  ArticleJson,
  ArticleSection,
  ExtractedProfileFacts,
  IntakeData,
} from "@/types/article";
import {
  generateText,
  generateVision,
  hasAiKey,
  parseJsonFromModel,
  TEXT_MODEL_CREATIVE,
  TEXT_MODEL_REALISM,
} from "@/lib/gemini";
import {
  controversyReferenceUrls,
  hasControversiesContent,
  resolveControversiesText,
} from "@/lib/intakeControversies";
import { synthesizeRealismBrief } from "@/lib/realismBrief";
import { buildMockArticle } from "@/lib/mockArticle";
import { normalizeArticleJson, articleWordCount } from "@/lib/normalizeArticle";
import { parseSectionFromRaw } from "@/lib/wikiSections";
import {
  buildCreativeBrief,
  creativeLengthHint,
  formatCreativeBrief,
} from "@/lib/creativeNarrative";
import type { SupplementalPhoto } from "@/lib/articleFigures";
import { ensureArticleImages } from "@/lib/articleImages";
import { INFOBOX_RULES } from "@/lib/infoboxHelpers";
import { WIKI_SECTION_STRUCTURE_RULES } from "@/lib/wikiSections";
import {
  realismQualityIssue,
  realismQualityIssueMessage,
  REALISM_PROSE_RULES,
  REALISM_REGURGITATION_RETRY_NOTE,
} from "@/lib/realismProse";
import { buildCompactGenerationPayload } from "@/lib/compactGenerationPayload";
import {
  creativeMinWordsForIntake,
  isSparseGenerationInput,
  realismArticleMaxTokens,
  realismMinWordsForIntake,
} from "@/lib/structuredIntakeForPrompt";

const REALISM_SECTIONS_REQUIRED_NOTE = `Your previous JSON was missing a valid "sections" array or section bodies were empty. Return complete JSON with sections: [{id, title, paragraphs: string[]}, ...] using ids early-life, education, career, personal-life as needed. Each section needs at least 2 original encyclopedic sentences — not templates.`;
const PROMPT_HEADSHOT_SENTINEL = "[infobox headshot provided separately]";

type PromptSupplementalPhoto = SupplementalPhoto & {
  visualDescription?: string;
  suggestedCaption?: string;
  suggestedSection?: string;
};

function realismStructuralIssue(
  article: ArticleJson,
  intake: IntakeData,
  minWords: number,
  supplementalPhotos: SupplementalPhoto[],
): string | null {
  const words = articleWordCount(article);
  if (!article.sections.length) {
    return `${REALISM_SECTIONS_REQUIRED_NOTE}\nPrior output had no usable body sections. Do not return lead-only JSON; include section paragraphs for every major fact cluster in the source.`;
  }
  if (words < minWords) {
    return `${REALISM_SECTIONS_REQUIRED_NOTE}\nArticle is only ${words} words; target at least ${minWords} words of flowing prose across sections using the fact sheet.`;
  }
  if (
    hasControversiesContent(intake) &&
    !article.sections.some((s) => s.id === "controversies")
  ) {
    return `${REALISM_SECTIONS_REQUIRED_NOTE}\n${realismControversiesRule(intake)}`;
  }
  if (supplementalPhotos.length > 0) {
    const figureCount = article.sections.reduce(
      (sum, section) => sum + (section.figures?.length ?? 0),
      0,
    );
    if (figureCount < supplementalPhotos.length) {
      return `SUPPLEMENTAL PHOTOS WERE DROPPED. Return complete JSON with sections and place each of the ${supplementalPhotos.length} supplemental photo(s) exactly once via figures: [{imageIndex, caption}] on relevant sections.`;
    }
  }
  return null;
}

function realismRewriteNote(fullName: string): string {
  return `${REALISM_REGURGITATION_RETRY_NOTE}
Write as a Wikipedia biographer for ${fullName}: cohesive paragraphs with transitions ("After…", "During…", "Later…"), proper capitalization (Boston College, Hewlett Packard Enterprise, India), no semicolon-chained notes, no one-sentence-per-field staccato style, and do not start every sentence with their full name.`;
}

function realismLengthHint(intake: IntakeData, facts: ExtractedProfileFacts): string {
  const min = realismMinWordsForIntake(intake, facts);
  const len = intake.articleLength;
  if (len === "short") {
    return `Target at least ${min} words total. Use fewer sections but complete sentences.`;
  }
  if (len === "long") {
    return `Target at least ${min} words total. Rich sections: early-life, education, career, personal-life, controversies if applicable.`;
  }
  return `Target at least ${min} words total across multiple sections (early-life, education, career, personal-life). Mostly plain paragraphs; subsections only where topics clearly split.`;
}

function buildPrompt(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  headshotUrl: string,
): string {
  return buildCompactGenerationPayload(
    intake,
    facts,
    headshotUrl ? PROMPT_HEADSHOT_SENTINEL : "",
  );
}

const NO_QUESTIONS_RULE = `PROSE STYLE (required): Write declarative encyclopedic sentences only. Never use rhetorical questions, direct questions to the reader, or sentences ending with "?". Do not write "The question is…", "It remains unclear whether…", or "Is X or Y?" lists. State facts and attributed debates in statements (e.g. "Commentators disagree on whether…" not "Did he…?"). Subsection titles must not contain "?".`;

function realismRules(): string {
  return `REALISM MODE: Use the subject's real name. Ground every claim in Q&A, pasted text, and extracted facts only. No invented major jobs, schools, awards, crimes, medical claims, family, or dates. If uncertain, use cautious encyclopedic wording ("has been reported to", "according to their profile") — never invent facts. Neutral tone; no marketing. References: user-provided, screenshot, or real URLs from inputs only.

${REALISM_PROSE_RULES}

${NO_QUESTIONS_RULE}`;
}

function creativeRules(brief: ReturnType<typeof buildCreativeBrief>): string {
  return `CREATIVE MODE — write a fictionalized but plausible Wikipedia biography that is ENGAGING to read.

VOICE: Still third-person and encyclopedic on the surface, but weave drama, specificity, irony, and narrative momentum. Vary sentence rhythm. Use vivid concrete details invented to support the story. NOT a résumé summary.

VARIETY (critical): This generation seed is "${brief.seed}". Follow narrativeAngle, mythicFrame, and plotDevices exactly. Do NOT reuse boilerplate openings or generic filler. Each regeneration must feel like a different biography of the same person.

LENGTH: Obey the word-count target strictly — err LONGER, not shorter.

INPUTS: Expand every item in mustWeaveFromInputs into scenes, institutions, dates (invented but consistent), rivals, places, and outcomes. If user mentions a project (e.g. military operation, startup, artwork), dramatize it with stakes and aftermath.

TONE PREFERENCE: Apply the user's tone field (founder/athlete/academic/artist/funny/legendary/mysterious) as a lens on top of the narrative brief.

SAFETY: No defamation of real living people beyond the subject's fictional legend, no explicit sexual content, no real-world criminal accusations, no medical diagnoses, no hate. Invented lore about the subject is allowed.

FORBIDDEN PHRASES: Never use: ${brief.avoidGenericPhrases.map((p) => `"${p}"`).join(", ")}.

${NO_QUESTIONS_RULE}`;
}

function formatPromptSupplementalPhotosForPrompt(
  photos: PromptSupplementalPhoto[],
): string {
  if (!photos.length) return "";
  return photos
    .map((p, i) => {
      const details = [
        p.description?.trim() ? `user note: ${p.description.trim()}` : "",
        p.visualDescription?.trim()
          ? `visual summary: ${p.visualDescription.trim()}`
          : "",
        p.targetSection?.trim()
          ? `preferred section: ${p.targetSection.trim()}`
          : "",
        p.suggestedSection?.trim()
          ? `suggested section: ${p.suggestedSection.trim()}`
          : "",
        p.caption?.trim() ? `preferred caption: ${p.caption.trim()}` : "",
        p.suggestedCaption?.trim()
          ? `caption idea: ${p.suggestedCaption.trim()}`
          : "",
      ].filter(Boolean);
      return `imageIndex ${i}: ${details.join("; ") || "no image note available; place where article context best fits"}.`;
    })
    .join("\n");
}

const PROMPT_SUPPLEMENTAL_PHOTOS_RULE = (photos: PromptSupplementalPhoto[]) =>
  photos.length > 0
    ? `SUPPLEMENTAL PHOTOS: User provided ${photos.length} extra photo(s). Place each exactly once via figures: [{imageIndex: 0..${photos.length - 1}, caption}] on the best section (career, personal-life, etc.). Captions: neutral Wikipedia style, third person, 8–20 words — rewrite the user's photo notes and visual summaries into proper captions; do not paste notes verbatim. imageIndex is NOT the infobox headshot.

PHOTO CONTEXT (by imageIndex; raw image data is attached after writing, not in this prompt):
${formatPromptSupplementalPhotosForPrompt(photos)}`
    : "";

function stringFromUnknown(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function describeSupplementalPhoto(
  photo: SupplementalPhoto,
  index: number,
  intake: IntakeData,
): Promise<PromptSupplementalPhoto> {
  const fallback: PromptSupplementalPhoto = { ...photo };
  if (!photo.dataUrl.startsWith("data:image/")) return fallback;

  const subject = intake.fullName || intake.articleTitle || "the article subject";
  const prompt = `Analyze this supplemental image for a Wikipedia-style biography about ${subject}. Return ONLY JSON with:
{
  "visualDescription": "one concise neutral sentence about what is visibly shown, no identity guesses unless provided by context",
  "suggestedSection": "one of early-life, education, career, personal-life, public-image, achievements, projects",
  "suggestedCaption": "8-20 word neutral caption"
}
User note: ${photo.description?.trim() || "none"}
Preferred section: ${photo.targetSection?.trim() || "none"}
Preferred caption: ${photo.caption?.trim() || "none"}`;

  try {
    const raw = await generateVision(prompt, [photo.dataUrl], {
      maxTokens: 500,
      requestTimeoutMs: 25_000,
    });
    const parsed = parseJsonFromModel<Record<string, unknown>>(raw);
    return {
      ...photo,
      visualDescription: stringFromUnknown(parsed.visualDescription).slice(0, 280),
      suggestedSection: stringFromUnknown(parsed.suggestedSection).slice(0, 48),
      suggestedCaption: stringFromUnknown(parsed.suggestedCaption).slice(0, 160),
    };
  } catch (error) {
    console.warn(
      `[WikiMe] Supplemental photo ${index} description failed; using provided notes only`,
      error instanceof Error ? error.message : String(error),
    );
    return fallback;
  }
}

async function describeSupplementalPhotosForPrompt(
  photos: SupplementalPhoto[],
  intake: IntakeData,
): Promise<PromptSupplementalPhoto[]> {
  if (!photos.length) return [];
  return Promise.all(
    photos.map((photo, index) => describeSupplementalPhoto(photo, index, intake)),
  );
}

const CREATIVE_CONTROVERSIES_RULE = `CONTROVERSIES (creative mode): When the narrative includes disputes, backlash, scandals, or polarizing episodes, add a "controversies" section (id controversies, title "Controversies") with 2–4 paragraphs. Omit entirely if nothing controversial fits.`;

function realismControversiesRule(intake: IntakeData): string {
  const text = resolveControversiesText(intake);
  if (!text) return "";
  const urls = controversyReferenceUrls(text);
  const urlNote =
    urls.length > 0
      ? ` Include these user-provided URLs in references[] (type "external-link" or "user-provided"): ${urls.join(" ")}`
      : "";
  return `CONTROVERSIES (required — user supplied material): You MUST include section id "controversies", title "Controversies", with 2–4 neutral encyclopedic paragraphs. Cover every allegation, named person, denial, and dispute the user described — use cautious attribution ("alleged", "according to", "has denied"). Do not omit or soften away user-provided controversy facts.${urlNote}

USER CONTROVERSY NOTES:
${text}`;
}

const CREATIVE_QUOTES_RULE = `ATTRIBUTED QUOTES (required in creative mode):
- Include exactly 1–2 blockquotes total across the article — like real Wikipedia biographies (journalists, rivals, colleagues, critics commenting on the subject).
- Place each in the most relevant section via optional quotes: [{text, attribution}].
- attribution format: "Speaker Name, Publication" or "Speaker Name, role, in interview with Outlet" — invent plausible speakers and outlets; keep tone encyclopedic.
- Quote text is 1–3 sentences; do not put quotes in summaryLead or infobox.`;

const ARTICLE_SCHEMA = `Return ONLY valid JSON (no markdown) with keys:
title, subtitle, summaryLead (string[]), infobox {name, imageUrl, caption, titles[], born, died, hometown, currentLocation, education, occupation, yearsActive, knownFor[], notableWorks[], awards[], allegiance[{name,flag}], branch[{name,flag}], socialLinks[{label,url}]},
sections[{id,title,paragraphs[],figures?:[{imageIndex,caption}] OR [{imageUrl,caption}],quotes?:[{text,attribution}],subsections?:[{title,paragraphs[]}]}],
seeAlso[], references[{label,title,url,type}], externalLinks[{label,url}], properNouns[] — ONLY real Wikipedia article titles for entities (e.g. "United States Army", "Medal of Honor", "West Point", "Lahore"). No generic words, no the subject's name, no fictional places, no made-up articles.

${INFOBOX_RULES}

${WIKI_SECTION_STRUCTURE_RULES}`;

const SPARSE_INPUT_RULE = `SPARSE BIOGRAPHY INPUT: The user only provided a name plus very little text. Produce a complete article anyway.
- REALISM: Use cautious encyclopedic language for unknowns ("little has been published about…", "according to the user's note…"). Do not invent employers, schools, awards, or family. Keep sections shorter but still structured.
- CREATIVE: Invent lore that clearly branches from the few given facts; do not contradict them. Prefer compact scenes over encyclopedic sprawl.`;

async function callCreativeGenerator(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  headshotUrl: string,
  brief: ReturnType<typeof buildCreativeBrief>,
  attempt: number,
  supplementalPhotos: SupplementalPhoto[],
  promptSupplementalPhotos: PromptSupplementalPhoto[],
): Promise<ArticleJson> {
  const sparse = isSparseGenerationInput(intake, facts);
  const lengthHint = creativeLengthHint(intake.articleLength, { sparse });
  const controversyRule = realismControversiesRule(intake);
  const sparseRule = sparse ? `${SPARSE_INPUT_RULE} ` : "";
  const system = `You are a virtuoso biographer writing Wikipedia-shaped JSON. ${creativeRules(brief)} ${CREATIVE_CONTROVERSIES_RULE} ${controversyRule} ${CREATIVE_QUOTES_RULE} ${PROMPT_SUPPLEMENTAL_PHOTOS_RULE(promptSupplementalPhotos)} ${sparseRule}${lengthHint} ${ARTICLE_SCHEMA}`;
  const user = `Generate a CREATIVE MODE article (attempt ${attempt}).
tone=${intake.tone}
supplementalPhotoCount=${supplementalPhotos.length}
NARRATIVE_BRIEF (follow strictly):
${formatCreativeBrief(brief)}
USER_DATA:
${buildPrompt(intake, facts, headshotUrl)}`;

  const maxTokens =
    intake.articleLength === "long"
      ? 8192
      : intake.articleLength === "short"
        ? 5000
        : 7000;

  const raw = await generateText(system, user, {
    model: TEXT_MODEL_CREATIVE,
    temperature: attempt === 1 ? 1.05 : 1.15,
    topP: 0.92,
    maxTokens,
    requestTimeoutMs: sparse ? 150_000 : 120_000,
  });

  let parsed: unknown;
  try {
    parsed = parseJsonFromModel<unknown>(raw);
  } catch {
    const retryRaw = await generateText(system, user, {
      model: TEXT_MODEL_CREATIVE,
      temperature: 0.85,
      topP: 0.9,
      maxTokens: Math.min(maxTokens + 2048, 8192),
      requestTimeoutMs: sparse ? 150_000 : 120_000,
    });
    parsed = parseJsonFromModel<unknown>(retryRaw);
  }
  return normalizeArticleJson(parsed, intake, headshotUrl, {
    creative: true,
    supplementalPhotos,
  });
}

export async function generateArticle(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  headshotUrl: string,
  supplementalPhotos: SupplementalPhoto[] = [],
): Promise<ArticleJson> {
  const finalize = (article: ArticleJson) =>
    ensureArticleImages(
      article,
      headshotUrl,
      supplementalPhotos,
      intake.fullName || intake.articleTitle,
    );

  if (!hasAiKey()) {
    const mock = buildMockArticle(intake, headshotUrl);
    if (headshotUrl) mock.infobox.imageUrl = headshotUrl;
    return finalize(mock);
  }

  const promptSupplementalPhotos = await describeSupplementalPhotosForPrompt(
    supplementalPhotos,
    intake,
  );

  if (intake.mode === "creative") {
    const brief = buildCreativeBrief(intake);
    let article = await callCreativeGenerator(
      intake,
      facts,
      headshotUrl,
      brief,
      1,
      supplementalPhotos,
      promptSupplementalPhotos,
    );
    const minWords = creativeMinWordsForIntake(intake, facts);
    if (articleWordCount(article) < minWords) {
      const retryBrief = buildCreativeBrief(intake);
      article = await callCreativeGenerator(
        intake,
        facts,
        headshotUrl,
        retryBrief,
        2,
        supplementalPhotos,
        promptSupplementalPhotos,
      );
    }
    if (articleWordCount(article) < minWords) {
      const retryBrief = buildCreativeBrief(intake);
      article = await callCreativeGenerator(
        intake,
        facts,
        headshotUrl,
        retryBrief,
        3,
        supplementalPhotos,
        promptSupplementalPhotos,
      );
    }
    return finalize(article);
  }

  const sparse = isSparseGenerationInput(intake, facts);
  const factSheet = await synthesizeRealismBrief(intake, facts, { sparse });
  const sourceFacts = buildPrompt(intake, facts, headshotUrl);
  const controversyRule = realismControversiesRule(intake);

  const sparseRule = sparse ? `${SPARSE_INPUT_RULE}\n\n` : "";
  const system = `You are an experienced Wikipedia biographer. Output biography JSON only. ${realismRules()} ${controversyRule} ${PROMPT_SUPPLEMENTAL_PHOTOS_RULE(promptSupplementalPhotos)} ${sparseRule}${realismLengthHint(intake, facts)} ${ARTICLE_SCHEMA}

CRITICAL OUTPUT RULES:
- The JSON MUST include a non-empty "sections" array with at least early-life, education, career, and personal-life when facts support them (plus controversies if user supplied any).
- Users may paste their entire biography into one free-form field — use the fact sheet and raw data to sort facts into the correct sections; do not ignore content because it was not in a labeled form field.
- NEVER use template phrases like "has worked in roles including", "holds BS", or paste occupation/education fields verbatim into body text.
- Body prose must be rewritten from facts — infobox fields are summaries only.
- Paragraphs must read like Wikipedia: objective, connected, and chronological where possible — not a series of standalone sentences for each questionnaire field.`;

  const userBase = `Generate a REALISM MODE article for ${intake.fullName}. tone=${intake.tone}. supplementalPhotoCount=${supplementalPhotos.length}. headshot=${headshotUrl ? "provided for infobox after writing" : "none"}.

Write as if drafting a real Wikipedia biography: neutral, factual, and readable — weave the fact sheet into flowing paragraphs with transitions, not one sentence per bullet.

FACT SHEET (editor notes — synthesize into narrative prose; do not copy bullets verbatim):
${factSheet}

RAW SOURCE DATA (for accuracy only — do not paste into paragraphs):
${sourceFacts}`;

  const maxTokens = realismArticleMaxTokens(intake.articleLength);
  const normalizeOpts = {
    creative: false as const,
    supplementalPhotos,
    allowMockSectionFallback: false,
  };

  async function runRealismPass(extraUserNote = ""): Promise<ArticleJson> {
    const user = extraUserNote ? `${userBase}\n\n${extraUserNote}` : userBase;
    const raw = await generateText(system, user, {
      model: TEXT_MODEL_REALISM,
      temperature: extraUserNote ? 0.5 : 0.62,
      maxTokens,
      requestTimeoutMs: sparse ? 150_000 : 120_000,
    });
    let parsed: unknown;
    try {
      parsed = parseJsonFromModel<unknown>(raw);
    } catch {
      const retryRaw = await generateText(system, user, {
        model: TEXT_MODEL_REALISM,
        temperature: 0.45,
        maxTokens: Math.min(maxTokens + 1500, 8192),
        requestTimeoutMs: sparse ? 150_000 : 120_000,
      });
      parsed = parseJsonFromModel<unknown>(retryRaw);
    }
    return normalizeArticleJson(parsed, intake, headshotUrl, normalizeOpts);
  }

  const minWords = realismMinWordsForIntake(intake, facts);

  function needsRealismRetry(article: ArticleJson): string | null {
    const structural = realismStructuralIssue(
      article,
      intake,
      minWords,
      supplementalPhotos,
    );
    if (structural) return structural;
    const issue = realismQualityIssue(article, intake);
    if (!issue) return null;
    const detail = realismQualityIssueMessage(issue);
    return `${realismRewriteNote(intake.fullName)}\nProblem detected: ${detail} Paraphrase all intake facts; keep employers and schools but rewrite sentence structure.`;
  }

  let article = await runRealismPass();
  for (let attempt = 0; attempt < 5; attempt++) {
    const note = needsRealismRetry(article);
    if (!note) break;
    article = await runRealismPass(note);
  }

  const finalStructuralIssue = realismStructuralIssue(
    article,
    intake,
    minWords,
    supplementalPhotos,
  );
  if (finalStructuralIssue) {
    article = await runRealismPass(
      `FINAL REMEDIATION: Prior output was structurally incomplete. ${finalStructuralIssue}
Return complete article JSON. The body must not be lead-only. Use sections for early life, education, career, projects or achievements, controversies if supplied, and personal life when facts support them.`,
    );
    const issueAfter = realismStructuralIssue(
      article,
      intake,
      minWords,
      supplementalPhotos,
    );
    if (issueAfter) {
      throw new Error(
        `AI returned an incomplete article after retries (${issueAfter.split("\n")[0]}). Please try again with a shorter Additional info paste or move key facts into the labeled fields.`,
      );
    }
  }

  const finalIssue = realismQualityIssue(article, intake);
  if (finalIssue) {
    const wordCount = articleWordCount(article);
    const hardBlock =
      finalIssue === "mock_template" ||
      finalIssue === "forbidden_phrase" ||
      !article.sections.length ||
      wordCount < 200;
    if (hardBlock) {
      article = await runRealismPass(
        "FINAL REMEDIATION: Prior output was structurally invalid, templated, or far too short. Return complete JSON with non-empty sections and original encyclopedic paragraphs grounded in the fact sheet — no placeholders, no pasted field lists.",
      );
      const issueAfter = realismQualityIssue(article, intake);
      const wcAfter = articleWordCount(article);
      const stillHard =
        issueAfter === "mock_template" ||
        issueAfter === "forbidden_phrase" ||
        !article.sections.length ||
        wcAfter < 200;
      if (stillHard) {
        throw new Error(
          `AI returned templated or copied text instead of an original article (${realismQualityIssueMessage(issueAfter ?? finalIssue)}). Please try generating again.`,
        );
      }
    } else {
      console.warn(
        "[WikiMe] Accepting realism article after retries with minor quality flag:",
        finalIssue,
        "words=",
        wordCount,
      );
    }
  }

  return finalize(article);
}

export async function regenerateSection(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  currentArticle: ArticleJson,
  sectionId: string,
  headshotUrl: string,
): Promise<ArticleSection> {
  const existing = currentArticle.sections.find((s) => s.id === sectionId);
  if (!hasAiKey()) {
    return (
      existing ?? {
        id: sectionId,
        title: sectionId,
        paragraphs: ["Regenerated section (demo mode)."],
      }
    );
  }

  const isCreative = intake.mode === "creative";
  const brief = isCreative ? buildCreativeBrief(intake) : null;
  const modeRules = isCreative
    ? creativeRules(brief!)
    : realismRules();
  const system = `Regenerate ONE Wikipedia section as JSON: {id, title, paragraphs[], quotes?:[{text,attribution}], subsections:[{title,paragraphs[]}]}. ${
    isCreative
      ? `${modeRules} ${CREATIVE_QUOTES_RULE} Seed: ${brief!.seed}.`
      : modeRules
  } ${WIKI_SECTION_STRUCTURE_RULES}`;
  const user = `Section id: ${sectionId}. Keep the generic Wikipedia section title for this id (do not use a narrative title). Existing: ${existing?.title ?? sectionId}. Subject: ${intake.fullName}. Payload: ${buildCompactGenerationPayload(intake, facts, headshotUrl ? PROMPT_HEADSHOT_SENTINEL : "")}${brief ? `. Brief seed: ${brief.seed}` : ""}`;

  const maxTokens = isCreative ? 2800 : 1800;
  const raw = await generateText(system, user, {
    temperature: isCreative ? 1.1 : 0.6,
    topP: isCreative ? 0.92 : undefined,
    model: isCreative ? TEXT_MODEL_CREATIVE : TEXT_MODEL_REALISM,
    maxTokens,
  });
  let parsed: Record<string, unknown>;
  try {
    parsed = parseJsonFromModel<Record<string, unknown>>(raw);
  } catch {
    const retryRaw = await generateText(system, user, {
      temperature: isCreative ? 0.85 : 0.55,
      topP: isCreative ? 0.9 : undefined,
      model: isCreative ? TEXT_MODEL_CREATIVE : TEXT_MODEL_REALISM,
      maxTokens: maxTokens + 800,
    });
    parsed = parseJsonFromModel<Record<string, unknown>>(retryRaw);
  }
  return (
    parseSectionFromRaw(parsed) ?? {
      id: sectionId,
      title: existing?.title ?? sectionId,
      paragraphs: existing?.paragraphs ?? ["Section could not be regenerated."],
    }
  );
}
