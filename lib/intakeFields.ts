import type { ArticleLength, IntakeData, TonePreference } from "@/types/article";

export type IntakeFieldKey = keyof Omit<
  IntakeData,
  "mode" | "tone" | "articleLength"
>;

export type IntakeSlide =
  | {
      id: string;
      type: "fields";
      title: string;
      subtitle?: string;
      fields: IntakeFieldDef[];
    }
  | {
      id: string;
      type: "mode";
      title: string;
      subtitle?: string;
    }
  | {
      id: string;
      type: "tone-length";
      title: string;
      subtitle?: string;
    };

/** Grey hint text for empty intake fields (desktop + mobile). */
export const INTAKE_PLACEHOLDERS: Record<IntakeFieldKey, string> = {
  fullName: "Alex Johnson",
  articleTitle: "Alex Johnson",
  birthplace: "Austin, Texas",
  birthday: "12 August 1990",
  deathDate: "",
  currentLocation: "Brooklyn, New York",
  education: "MIT, B.S. Computer Science",
  occupation: "Software engineer, Founder & CEO at Acme Inc.",
  achievements: "Forbes 30 Under 30; design, public speaking, Python…",
  lifeEvents: "Moved to NYC in 2018, founded company in 2020…",
  controversies:
    "Optional: disputes, allegations, denials — appears as a Controversies section…",
  extraNotes:
    "Paste your whole story here — LinkedIn, resume, family, jobs, awards, controversies. WikiMe sorts it into the article even if you skip the fields below…",
  pastedProfileText:
    "Or paste a profile here instead (optional if you used Additional info above)…",
  instagramUrl: "instagram.com/yourname",
  linkedinUrl: "linkedin.com/in/yourname",
  xUrl: "x.com/yourname",
};

export interface IntakeFieldDef {
  key: IntakeFieldKey;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  optional?: boolean;
  autocomplete?: string;
  inputMode?: "text" | "search" | "url";
  /** Use URL keyboard and validation-friendly input on create form */
  urlField?: boolean;
  name?: string;
}

export const INTAKE_SLIDES: IntakeSlide[] = [
  {
    id: "mode",
    type: "mode",
    title: "Choose your mode",
    subtitle: "Realism stays grounded in your facts. Creative builds a legendary story.",
  },
  {
    id: "name",
    type: "fields",
    title: "What's your name?",
    subtitle: "Use the name you'd like on your Wikipedia page.",
    fields: [
      {
        key: "fullName",
        label: "Full name",
        placeholder: INTAKE_PLACEHOLDERS.fullName,
        required: true,
        autocomplete: "name",
        name: "name",
      },
    ],
  },
  {
    id: "title",
    type: "fields",
    title: "Article title",
    subtitle: "Usually the same as your full name.",
    fields: [
      {
        key: "articleTitle",
        label: "Title",
        placeholder: INTAKE_PLACEHOLDERS.articleTitle,
        required: true,
        autocomplete: "nickname",
        name: "nickname",
      },
    ],
  },
  {
    id: "location",
    type: "fields",
    title: "Where are you based?",
    subtitle: "City or region — autofill may suggest your location.",
    fields: [
      {
        key: "currentLocation",
        label: "Current location",
        placeholder: INTAKE_PLACEHOLDERS.currentLocation,
        autocomplete: "address-level2",
        name: "address-level2",
      },
    ],
  },
  {
    id: "hometown",
    type: "fields",
    title: "Hometown or birthplace",
    subtitle: "Optional but helps ground your story.",
    fields: [
      {
        key: "birthplace",
        label: "Birthplace / hometown",
        placeholder: INTAKE_PLACEHOLDERS.birthplace,
        optional: true,
        autocomplete: "birthplace",
        name: "birthplace",
      },
      {
        key: "birthday",
        label: "Birthday",
        placeholder: INTAKE_PLACEHOLDERS.birthday,
        optional: true,
        autocomplete: "bday",
        name: "bday",
      },
      {
        key: "deathDate",
        label: "Death date (if applicable)",
        placeholder: INTAKE_PLACEHOLDERS.deathDate,
        optional: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "education",
    type: "fields",
    title: "Education",
    fields: [
      {
        key: "education",
        label: "Schools, degrees",
        placeholder: INTAKE_PLACEHOLDERS.education,
        optional: true,
        autocomplete: "organization",
        name: "organization",
      },
    ],
  },
  {
    id: "work",
    type: "fields",
    title: "Occupation & role",
    subtitle: "Your field, job title, or how you'd describe what you do.",
    fields: [
      {
        key: "occupation",
        label: "Occupation / role",
        placeholder: INTAKE_PLACEHOLDERS.occupation,
        optional: true,
        autocomplete: "organization-title",
        name: "organization-title",
      },
    ],
  },
  {
    id: "achievements",
    type: "fields",
    title: "Achievements & skills",
    subtitle: "Awards, milestones, and skills — optional.",
    fields: [
      {
        key: "achievements",
        label: "Achievements & skills",
        placeholder: INTAKE_PLACEHOLDERS.achievements,
        optional: true,
        textarea: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "life",
    type: "fields",
    title: "Life events",
    fields: [
      {
        key: "lifeEvents",
        label: "Important events",
        placeholder: INTAKE_PLACEHOLDERS.lifeEvents,
        optional: true,
        textarea: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "controversies",
    type: "fields",
    title: "Controversies",
    subtitle:
      "Optional. Disputes, scandals, or allegations — included as a Wikipedia-style Controversies section when provided.",
    fields: [
      {
        key: "controversies",
        label: "Controversies",
        placeholder: INTAKE_PLACEHOLDERS.controversies,
        optional: true,
        textarea: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "style",
    type: "tone-length",
    title: "Tone & length",
    subtitle: "How should it read?",
  },
  {
    id: "profile",
    type: "fields",
    title: "Paste profile text",
    subtitle: "Optional: LinkedIn, resume, or bio — improves accuracy.",
    fields: [
      {
        key: "pastedProfileText",
        label: "Profile text",
        placeholder: INTAKE_PLACEHOLDERS.pastedProfileText,
        optional: true,
        textarea: true,
        autocomplete: "off",
      },
      {
        key: "extraNotes",
        label: "Extra notes",
        placeholder: INTAKE_PLACEHOLDERS.extraNotes,
        optional: true,
        textarea: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "mode-confirm",
    type: "mode",
    title: "Confirm your mode",
    subtitle: "You chose this at the start — change it here if you want something different.",
  },
];

export const REVIEW_ROWS: {
  key: IntakeFieldKey | "mode" | "tone" | "articleLength";
  label: string;
}[] = [
  { key: "mode", label: "Mode" },
  { key: "fullName", label: "Name" },
  { key: "articleTitle", label: "Title" },
  { key: "currentLocation", label: "Location" },
  { key: "birthplace", label: "Hometown" },
  { key: "birthday", label: "Birthday" },
  { key: "deathDate", label: "Death date" },
  { key: "education", label: "Education" },
  { key: "occupation", label: "Occupation / role" },
  { key: "achievements", label: "Achievements & skills" },
  { key: "lifeEvents", label: "Life events" },
  { key: "controversies", label: "Controversies" },
  { key: "tone", label: "Tone" },
  { key: "articleLength", label: "Length" },
  { key: "pastedProfileText", label: "Profile text" },
  { key: "extraNotes", label: "Notes" },
];

export function displayValue(
  intake: IntakeData,
  key: (typeof REVIEW_ROWS)[number]["key"],
): string {
  if (key === "mode") return intake.mode === "creative" ? "Creative" : "Realism";
  if (key === "tone") return intake.tone;
  if (key === "articleLength") return intake.articleLength;
  const v = intake[key as IntakeFieldKey];
  return typeof v === "string" && v.trim() ? v.trim() : "—";
}

export const TONE_OPTIONS: { value: TonePreference; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "founder", label: "Founder" },
  { value: "athlete", label: "Athlete" },
  { value: "academic", label: "Academic" },
  { value: "artist", label: "Artist" },
  { value: "funny", label: "Funny" },
  { value: "legendary", label: "Legendary" },
  { value: "mysterious", label: "Mysterious" },
];

export const LENGTH_OPTIONS: { value: ArticleLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "long", label: "Long" },
];
