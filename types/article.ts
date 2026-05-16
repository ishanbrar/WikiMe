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
  currentLocation: string;
  education: string;
  occupation: string;
  currentRole: string;
  notableProjects: string;
  achievements: string;
  skills: string;
  interests: string;
  lifeEvents: string;
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

export interface ArticleSection {
  id: string;
  title: string;
  paragraphs: string[];
  /** Specific in-section headings (Wikipedia h3-style); TOC uses only generic `title`. */
  subsections?: ArticleSubsection[];
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
}

export interface SavedArticle {
  id: string;
  slug: string;
  articleJson: ArticleJson;
  mode: ArticleMode;
  intake: IntakeData;
  headshotDataUrl?: string;
  extractedFacts?: ExtractedProfileFacts;
  userId?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  mode: ArticleMode;
  createdAt: string;
  updatedAt: string;
}

export interface AppearanceSettings {
  textSize: "small" | "standard" | "large";
  width: "standard" | "wide";
  color: "auto" | "light" | "dark";
}
