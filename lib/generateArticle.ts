import type {
  ArticleJson,
  ArticleSection,
  ExtractedProfileFacts,
  IntakeData,
} from "@/types/article";
import {
  generateText,
  hasAiKey,
  parseJsonFromModel,
  TEXT_MODEL_CREATIVE,
  TEXT_MODEL_REALISM,
} from "@/lib/gemini";
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
import { INFOBOX_RULES } from "@/lib/infoboxHelpers";
import { WIKI_SECTION_STRUCTURE_RULES } from "@/lib/wikiSections";
import {
  isRegurgitatedRealism,
  REALISM_PROSE_RULES,
  REALISM_REGURGITATION_RETRY_NOTE,
} from "@/lib/realismProse";

function realismLengthHint(len: IntakeData["articleLength"]): string {
  if (len === "short") return "Keep total under ~600 words. Fewer sections.";
  if (len === "long") return "Up to ~1500 words. Richer sections.";
  return "Moderate length ~900 words. Mostly plain paragraphs; subsections only where topics clearly split.";
}

function buildPrompt(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  headshotUrl: string,
): string {
  const compact = {
    intake: {
      fullName: intake.fullName,
      articleTitle: intake.articleTitle,
      birthplace: intake.birthplace,
      birthday: intake.birthday,
      deathDate: intake.deathDate,
      currentLocation: intake.currentLocation,
      education: intake.education,
      occupation: intake.occupation,
      achievements: intake.achievements,
      lifeEvents: intake.lifeEvents,
      tone: intake.tone,
      extraNotes: intake.extraNotes,
      pastedProfileText: intake.pastedProfileText?.slice(0, 3000),
    },
    extractedFacts: facts,
    headshotUrl: headshotUrl || "",
    articleLength: intake.articleLength,
  };
  return JSON.stringify(compact);
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

const SUPPLEMENTAL_PHOTOS_RULE = (count: number) =>
  count > 0
    ? `SUPPLEMENTAL PHOTOS: User provided ${count} extra photo(s). Place each exactly once via figures: [{imageIndex: 0..${count - 1}, caption}] on the best section (career, personal-life, etc.). Captions: neutral Wikipedia style, third person, 8–20 words. imageIndex is NOT the infobox headshot.`
    : "";

const CREATIVE_CONTROVERSIES_RULE = `CONTROVERSIES (creative mode): When the narrative includes disputes, backlash, scandals, or polarizing episodes, add a "controversies" section (id controversies, title "Controversies") with 2–4 paragraphs. Omit entirely if nothing controversial fits.`;

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

const CREATIVE_MIN_WORDS: Record<IntakeData["articleLength"], number> = {
  short: 700,
  standard: 1400,
  long: 2400,
};

async function callCreativeGenerator(
  intake: IntakeData,
  facts: ExtractedProfileFacts,
  headshotUrl: string,
  brief: ReturnType<typeof buildCreativeBrief>,
  attempt: number,
  supplementalPhotos: SupplementalPhoto[],
): Promise<ArticleJson> {
  const lengthHint = creativeLengthHint(intake.articleLength);
  const system = `You are a virtuoso biographer writing Wikipedia-shaped JSON. ${creativeRules(brief)} ${CREATIVE_CONTROVERSIES_RULE} ${CREATIVE_QUOTES_RULE} ${SUPPLEMENTAL_PHOTOS_RULE(supplementalPhotos.length)} ${lengthHint} ${ARTICLE_SCHEMA}`;
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
  if (!hasAiKey()) {
    const mock = buildMockArticle(intake, headshotUrl);
    if (headshotUrl) mock.infobox.imageUrl = headshotUrl;
    return mock;
  }

  if (intake.mode === "creative") {
    const brief = buildCreativeBrief(intake);
    let article = await callCreativeGenerator(
      intake,
      facts,
      headshotUrl,
      brief,
      1,
      supplementalPhotos,
    );
    const minWords = CREATIVE_MIN_WORDS[intake.articleLength];
    if (articleWordCount(article) < minWords) {
      const retryBrief = buildCreativeBrief(intake);
      article = await callCreativeGenerator(
        intake,
        facts,
        headshotUrl,
        retryBrief,
        2,
        supplementalPhotos,
      );
    }
    return article;
  }

  const factSheet = await synthesizeRealismBrief(intake, facts);

  const system = `You are an experienced Wikipedia biographer. Output biography JSON only. ${realismRules()} ${SUPPLEMENTAL_PHOTOS_RULE(supplementalPhotos.length)} ${realismLengthHint(intake.articleLength)} ${ARTICLE_SCHEMA}`;
  const userBase = `Generate a REALISM MODE article for ${intake.fullName}. tone=${intake.tone}. supplementalPhotoCount=${supplementalPhotos.length}. headshotUrl=${headshotUrl || "none"}.

You are given a normalized FACT SHEET produced by an editor who already read the user's questionnaire. Write original encyclopedic prose from these facts only — never paste bullet text or repeat the subject's name at the start of every sentence.

FACT SHEET:
${factSheet}`;

  const maxTokens = intake.articleLength === "long" ? 7000 : 5500;

  async function runRealismPass(extraUserNote = ""): Promise<ArticleJson> {
    const user = extraUserNote ? `${userBase}\n\n${extraUserNote}` : userBase;
    const raw = await generateText(system, user, {
      model: TEXT_MODEL_REALISM,
      temperature: extraUserNote ? 0.5 : 0.58,
      maxTokens,
    });
    let parsed: unknown;
    try {
      parsed = parseJsonFromModel<unknown>(raw);
    } catch {
      const retryRaw = await generateText(system, user, {
        model: TEXT_MODEL_REALISM,
        temperature: 0.45,
        maxTokens: Math.min(maxTokens + 1500, 8192),
      });
      parsed = parseJsonFromModel<unknown>(retryRaw);
    }
    return normalizeArticleJson(parsed, intake, headshotUrl, {
      creative: false,
      supplementalPhotos,
    });
  }

  let article = await runRealismPass();
  if (isRegurgitatedRealism(article, intake)) {
    article = await runRealismPass(REALISM_REGURGITATION_RETRY_NOTE);
  }
  if (isRegurgitatedRealism(article, intake)) {
    article = await runRealismPass(
      `${REALISM_REGURGITATION_RETRY_NOTE}\nMerge family facts into one early-life paragraph. Athletics belong in career or personal-life once only — no duplicated paragraphs.`,
    );
  }
  return article;
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
  const user = `Section id: ${sectionId}. Keep the generic Wikipedia section title for this id (do not use a narrative title). Existing: ${existing?.title ?? sectionId}. Article context: ${JSON.stringify({ title: currentArticle.title, intake: intake.fullName, facts, brief })}. Headshot: ${headshotUrl}`;

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
