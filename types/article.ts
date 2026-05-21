export type ArticleMode = "realism" | "creative";

export type ArticleLength = "short" | "standard" | "long";

export type TonePreference =
  | "neutral"
  | "founder"
  | "athlete"
  | "academic"
  | "artist"
  | "funny"
  | "legendary"
  | "mysterious";

export interface IntakeData {
  fullName: string;
  articleTitle: string;
  birthplace: string;
  /** Optional birth date (e.g. 12 August 1998) */
  birthday: string;
  /** Optional death date (e.g. 3 March 2021); leave blank if living */
  deathDate: string;
  currentLocation: string;
  education: string;
  occupation: string;
  achievements: string;
  lifeEvents: string;
  /** Optional disputes/scandals for a Wikipedia-style Controversies section */
  controversies: string;
  tone: TonePreference;
  mode: ArticleMode;
  extraNotes: string;
  pastedProfileText: string;
  articleLength: ArticleLength;
}

export interface ExtractedProfileFacts {
  detectedName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  education: string[];
  work: string[];
  projects: string[];
  skills: string[];
  links: string[];
  notableClaims: string[];
  rawUsefulText: string[];
}

export interface InfoboxAllegiance {
  name: string;
  /** ISO 3166-1 alpha-2 (e.g. US, IN) for flag emoji in infobox */
  flag?: string;
}

export interface ArticleInfobox {
  name: string;
  imageUrl: string;
  caption: string;
  /** Honorifics / epithets under the name (Wikipedia style) */
  titles?: string[];
  born: string;
  /** Death date and place; empty if living */
  died?: string;
  hometown: string;
  currentLocation: string;
  education: string;
  occupation: string;
  yearsActive: string;
  knownFor: string[];
  notableWorks: string[];
  awards: string[];
  allegiance?: InfoboxAllegiance[];
  branch?: InfoboxAllegiance[];
  socialLinks: { label: string; url: string }[];
}

export interface ArticleSubsection {
  title: string;
  paragraphs: string[];
}

/** Wikipedia-style thumbnail figure in a section body */
export interface ArticleFigure {
  imageUrl: string;
  caption: string;
}

/** Wikipedia-style blockquote attributed to a third party (creative mode). */
export interface ArticleQuote {
  text: string;
  attribution: string;
}

export interface ArticleSection {
  id: string;
  title: string;
  paragraphs: string[];
  /** Attributed quotes about the subject, placed in this section. */
  quotes?: ArticleQuote[];
  /** Specific in-section headings (Wikipedia h3-style); TOC uses only generic `title`. */
  subsections?: ArticleSubsection[];
  /** Optional inline photos with captions (supplemental uploads) */
  figures?: ArticleFigure[];
}

export interface ArticleReference {
  label: string;
  title: string;
  url: string | null;
  type: "user-provided" | "social-profile" | "external-link";
}

export interface ArticleJson {
  title: string;
  subtitle: string;
  summaryLead: string[];
  infobox: ArticleInfobox;
  sections: ArticleSection[];
  seeAlso: string[];
  references: ArticleReference[];
  externalLinks: { label: string; url: string }[];
  properNouns: string[];
  /** Optional Wikipedia article title per linked phrase (key = phrase as stored in properNouns). */
  linkTitles?: Record<string, string>;
}

export interface SavedArticle {
  id: string;
  slug: string;
  articleJson: ArticleJson;
  mode: ArticleMode;
  intake: IntakeData;
  headshotDataUrl?: string;
  /** Up to 2 supplemental photos for inline article figures */
  extraPhotoUrls?: string[];
  extractedFacts?: ExtractedProfileFacts;
  userId?: string;
  creatorEmail?: string;
  isPublic?: boolean;
  /** When true, public URL is /{slug} (set by admin custom link). */
  shortLink?: boolean;
  /** Slug of the paired Realism ↔ Creative article, when both were generated. */
  alternateSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  mode: ArticleMode;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppearanceSettings {
  textSize: "small" | "standard" | "large";
  width: "standard" | "wide";
  color: "auto" | "light" | "dark";
}
