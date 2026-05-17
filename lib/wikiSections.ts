import type {
  ArticleFigure,
  ArticleQuote,
  ArticleSection,
  ArticleSubsection,
} from "@/types/article";

/** Standard biography TOC entries (Wikipedia-style generic titles). */
export const WIKI_SECTION_CATALOG: { id: string; title: string }[] = [
  { id: "early-life", title: "Early life" },
  { id: "education", title: "Education" },
  { id: "career", title: "Career" },
  { id: "projects", title: "Projects" },
  { id: "public-image", title: "Public image" },
  { id: "controversies", title: "Controversies" },
  { id: "personal-life", title: "Personal life" },
  { id: "achievements", title: "Achievements" },
  { id: "legacy", title: "Legacy" },
];

export const WIKI_SECTION_TITLES: Record<string, string> = Object.fromEntries(
  WIKI_SECTION_CATALOG.map((s) => [s.id, s.title]),
);

export const WIKI_SECTION_ORDER = WIKI_SECTION_CATALOG.map((s) => s.id);

const ID_ALIASES: Record<string, string> = {
  "early_life": "early-life",
  earlylife: "early-life",
  childhood: "early-life",
  upbringing: "early-life",
  "military-career": "career",
  military: "career",
  militia: "career",
  activism: "career",
  "professional-life": "career",
  work: "career",
  "notable-projects": "projects",
  project: "projects",
  "public_image": "public-image",
  reception: "public-image",
  controversy: "controversies",
  controversies: "controversies",
  "personal_life": "personal-life",
  biography: "personal-life",
  death: "legacy",
  aftermath: "legacy",
  honors: "achievements",
  awards: "achievements",
};

export const WIKI_SECTION_STRUCTURE_RULES = `WIKIPEDIA SECTION STRUCTURE (required):
- The table of contents uses ONLY generic section titles like a real biography (e.g. Akbar: "Early life", "Education", "Career", "Legacy") — never event-specific TOC lines.
- Use exactly these ids and titles (omit empty sections):
  early-life → "Early life"
  education → "Education"
  career → "Career"
  projects → "Projects"
  public-image → "Public image"
  controversies → "Controversies" (creative mode only — include when the fictional biography has disputes, backlash, or scandal worth a dedicated section; omit if none)
  personal-life → "Personal life"
  achievements → "Achievements"
  legacy → "Legacy"
- WRONG section title examples: "UCLA and the Seeds of Discontent", "The Colorado Raids", "Data War and the Legacy of Disruption".
- RIGHT: section title is "Career"; specific topics go in subsections (h3-style headings).

SUBSECTIONS (use sparingly — like Wikipedia, e.g. Akbar → Administration → "Political structure"):
- Most sections are 2–4 paragraphs directly under the section title with NO subsections.
- Add subsections[] only when one section covers several clearly separate topics (typically 1–2 subsections, rarely 3).
- Subsection titles are short noun phrases (3–6 words): "University of California, Los Angeles", "Colorado raids", "Reception" — NOT full sentences, questions, or truncated paragraph openings.
- NEVER use questions as subsection titles (no "?" — wrong: "Terrorist or Freedom Fighter?").
- WRONG subsection title: "Brar was born in Dallas and later attended UCLA where he…"
- When using subsections: optional 0–1 intro paragraph at section level, then each subsection has 1–2 paragraphs.
- Do NOT add subsections to every section. Short sections (Early life, Personal life) often need zero subsections.
- Order sections in the catalog order above when present.`;

const SUBSECTION_FALLBACKS: Record<string, string[]> = {
  "early-life": ["Family and background", "Childhood", "Early influences"],
  education: ["Primary and secondary education", "Higher education", "Academic activities"],
  career: ["Early career", "Major activities", "Later developments", "Controversies"],
  projects: ["Notable initiatives", "Key projects", "Outcomes"],
  "public-image": ["Media portrayal", "Public reception", "Criticism and praise"],
  controversies: ["Allegations", "Response", "Aftermath"],
  "personal-life": ["Relationships and family", "Personal views", "Private life"],
  achievements: ["Major accomplishments", "Recognition", "Impact"],
  legacy: ["Historical assessment", "Influence", "Memorialization"],
};

function fallbackSubsectionTitle(sectionId: string, index: number): string {
  const list = SUBSECTION_FALLBACKS[sectionId];
  if (list?.[index]) return list[index];
  return `Topic ${index + 1}`;
}

/** Short Wikipedia-style h3 title from paragraph opening. */
export function inferSubsectionTitle(
  paragraph: string,
  sectionId: string,
  index: number,
): string {
  const cleaned = paragraph
    .replace(/\[\[WIKI:[^\]]+\]\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() ?? cleaned;
  const words = firstSentence.split(/\s+/);
  let phrase = words.slice(0, Math.min(8, words.length)).join(" ");
  phrase = phrase.replace(/[,;:]$/, "").trim();
  if (phrase.length > 58) {
    phrase = phrase.slice(0, 55).trim() + "…";
  }
  if (phrase.length >= 10 && phrase.length <= 58) {
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }
  return fallbackSubsectionTitle(sectionId, index);
}

const MAX_SUBSECTIONS_PER_SECTION = 3;
const MAX_SUBSECTION_TITLE_LEN = 48;

function cleanSubsectionTitle(title: string): string {
  return title.replace(/\*\*/g, "").replace(/\?+$/g, "").trim();
}

function looksLikeInvalidSubsectionTitle(title: string): boolean {
  const t = cleanSubsectionTitle(title);
  if (!t) return true;
  if (t.includes("?")) return true;
  if (/^(who|what|when|where|why|how|is|are|was|were|did|does|do|can|could|should)\b/i.test(t)) {
    return true;
  }
  if (/\bor\b/i.test(t) && t.split(/\s+/).length <= 8) return true;
  if (t.length > MAX_SUBSECTION_TITLE_LEN) return true;
  if (t.endsWith("…") || t.endsWith("...")) return true;
  if (/\b(is|was|were|has|had|have|became|later)\b/i.test(t) && t.length > 28) {
    return true;
  }
  return false;
}

/** Fold auto-generated / low-quality subsections back into body text. */
export function polishSectionSubsections(section: ArticleSection): ArticleSection {
  let { paragraphs, subsections } = {
    paragraphs: [...section.paragraphs],
    subsections: section.subsections ? [...section.subsections] : [],
  };

  if (subsections.length === 0) {
    return { ...section, paragraphs, subsections: undefined };
  }

  subsections = subsections
    .map((s) => ({ ...s, title: cleanSubsectionTitle(s.title) }))
    .filter((s) => s.title && s.paragraphs.length);

  const invalid = subsections.filter((s) => looksLikeInvalidSubsectionTitle(s.title));
  if (invalid.length > 0) {
    paragraphs = [
      ...paragraphs,
      ...invalid.flatMap((s) => s.paragraphs),
    ];
    subsections = subsections.filter((s) => !looksLikeInvalidSubsectionTitle(s.title));
  }

  if (subsections.length > MAX_SUBSECTIONS_PER_SECTION) {
    const keep = subsections.slice(0, MAX_SUBSECTIONS_PER_SECTION);
    const overflow = subsections.slice(MAX_SUBSECTIONS_PER_SECTION);
    paragraphs = [
      ...paragraphs,
      ...overflow.flatMap((s) => s.paragraphs),
    ];
    subsections = keep;
  }

  subsections = subsections
    .map((s) => ({
      ...s,
      title:
        s.title.length > MAX_SUBSECTION_TITLE_LEN
          ? s.title.slice(0, MAX_SUBSECTION_TITLE_LEN - 1).trim() + "…"
          : s.title,
    }))
    .filter((s) => s.title && s.paragraphs.length && !looksLikeInvalidSubsectionTitle(s.title));

  return {
    ...section,
    paragraphs,
    subsections: subsections.length ? subsections : undefined,
  };
}

export function normalizeSectionId(rawId: string, rawTitle?: string): string {
  const slug = rawId
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (WIKI_SECTION_TITLES[slug]) return slug;
  if (ID_ALIASES[slug]) return ID_ALIASES[slug];

  const titleSlug = (rawTitle ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (WIKI_SECTION_TITLES[titleSlug]) return titleSlug;
  if (ID_ALIASES[titleSlug]) return ID_ALIASES[titleSlug];

  if (/early|child|born|family|youth/.test(slug) || /early|child/.test(titleSlug)) {
    return "early-life";
  }
  if (/educ|school|univers|college|ucla|degree/.test(slug + titleSlug)) {
    return "education";
  }
  if (/career|militia|activ|profession|work|raid|war|leader/.test(slug + titleSlug)) {
    return "career";
  }
  if (/project|venture|startup|operation/.test(slug + titleSlug)) {
    return "projects";
  }
  if (/controvers/.test(slug + titleSlug)) {
    return "controversies";
  }
  if (/public|image|reception|media/.test(slug + titleSlug)) {
    return "public-image";
  }
  if (/personal|marriage|family|life|allegat/.test(slug + titleSlug)) {
    return "personal-life";
  }
  if (/achiev|award|honor|notable/.test(slug + titleSlug)) {
    return "achievements";
  }
  if (/legacy|death|aftermath|influence|remember/.test(slug + titleSlug)) {
    return "legacy";
  }

  return slug || "career";
}

function parseQuotes(raw: unknown): ArticleQuote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const o = q as Record<string, unknown>;
      const text = typeof o.text === "string" ? o.text.trim() : "";
      const attribution =
        typeof o.attribution === "string" ? o.attribution.trim() : "";
      if (!text || !attribution) return null;
      return { text, attribution };
    })
    .filter((q): q is ArticleQuote => q !== null);
}

function parseSubsections(raw: unknown): ArticleSubsection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((sub) => {
      const o = sub as Record<string, unknown>;
      const paragraphs = Array.isArray(o.paragraphs)
        ? o.paragraphs.filter(
            (p): p is string => typeof p === "string" && p.trim().length > 0,
          )
        : [];
      const title = typeof o.title === "string" ? o.title.trim() : "";
      if (!title || !paragraphs.length) return null;
      return { title, paragraphs };
    })
    .filter((s): s is ArticleSubsection => s !== null);
}

export type ParsedFigure = ArticleFigure & { imageIndex?: number };

function parseFigures(raw: unknown): ParsedFigure[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => {
      const o = f as Record<string, unknown>;
      const imageUrl =
        typeof o.imageUrl === "string"
          ? o.imageUrl
          : typeof o.url === "string"
            ? o.url
            : "";
      const caption = typeof o.caption === "string" ? o.caption.trim() : "";
      const imageIndex =
        typeof o.imageIndex === "number" ? o.imageIndex : undefined;
      if (!caption) return null;
      if (!imageUrl && imageIndex === undefined) return null;
      const fig: ParsedFigure = { imageUrl, caption };
      if (imageIndex !== undefined) fig.imageIndex = imageIndex;
      return fig;
    })
    .filter((f): f is ParsedFigure => f !== null);
}

function mergeSections(a: ArticleSection, b: ArticleSection): ArticleSection {
  const quotes = [...(a.quotes ?? []), ...(b.quotes ?? [])];
  const figures = [...(a.figures ?? []), ...(b.figures ?? [])];
  return {
    id: a.id,
    title: a.title,
    paragraphs: [...a.paragraphs, ...b.paragraphs],
    quotes: quotes.length ? quotes : undefined,
    figures: figures.length ? figures : undefined,
    subsections: [...(a.subsections ?? []), ...(b.subsections ?? [])],
  };
}

/** Force generic TOC titles and merge duplicate section ids. */
export function normalizeWikiSections(
  sections: ArticleSection[],
  opts?: { creative?: boolean },
): ArticleSection[] {
  const byId = new Map<string, ArticleSection>();

  for (const sec of sections) {
    const id = normalizeSectionId(sec.id, sec.title);
    const title = WIKI_SECTION_TITLES[id] ?? "Career";
    const paragraphs = sec.paragraphs.filter(Boolean);
    const subsections = sec.subsections ?? [];
    const quotes = sec.quotes?.length ? sec.quotes : undefined;
    const figures = sec.figures?.length ? sec.figures : undefined;

    const next: ArticleSection = {
      id,
      title,
      paragraphs,
      quotes,
      figures,
      subsections: subsections.length ? subsections : undefined,
    };

    if (
      !paragraphs.length &&
      !subsections.length &&
      !quotes?.length &&
      !figures?.length
    ) {
      continue;
    }

    const existing = byId.get(id);
    if (existing) {
      byId.set(id, mergeSections(existing, next));
    } else {
      byId.set(id, next);
    }
  }

  const order = opts?.creative
    ? WIKI_SECTION_ORDER
    : WIKI_SECTION_ORDER.filter((id) => id !== "controversies");

  return order.filter((id) => byId.has(id)).map((id) =>
    polishSectionSubsections(byId.get(id)!),
  );
}

export function parseSectionFromRaw(raw: Record<string, unknown>): ArticleSection | null {
  const id = normalizeSectionId(
    typeof raw.id === "string" ? raw.id : "",
    typeof raw.title === "string" ? raw.title : "",
  );
  const title = WIKI_SECTION_TITLES[id] ?? "Career";
  const paragraphs = Array.isArray(raw.paragraphs)
    ? raw.paragraphs.filter(
        (p): p is string => typeof p === "string" && p.trim().length > 0,
      )
    : [];
  const subsections = parseSubsections(raw.subsections);
  const quotes = parseQuotes(raw.quotes);
  const figures = parseFigures(raw.figures);

  if (
    !paragraphs.length &&
    !subsections.length &&
    !quotes.length &&
    !figures.length
  ) {
    return null;
  }

  return {
    id,
    title,
    paragraphs,
    quotes: quotes.length ? quotes : undefined,
    figures: figures.length ? figures : undefined,
    subsections: subsections.length ? subsections : undefined,
  };
}
