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
  currentLocation: "Brooklyn, New York",
  education: "MIT, B.S. Computer Science",
  occupation: "Software engineering",
  currentRole: "Founder & CEO at Acme Inc.",
  notableProjects: "Built X, led Y initiative, open-sourced Z…",
  achievements: "Key wins, awards, press mentions…",
  skills: "Design, public speaking, Python…",
  interests: "Climbing, film, chess…",
  lifeEvents: "Moved to NYC in 2018, founded company in 2020…",
  extraNotes: "Anything else the article should mention…",
  pastedProfileText:
    "Paste your LinkedIn About section, resume summary, or bio…",
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
  name?: string;
}

export const INTAKE_SLIDES: IntakeSlide[] = [
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
    subtitle: "Usually the same as your name.",
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
    title: "Work",
    subtitle: "Field and current role.",
    fields: [
      {
        key: "occupation",
        label: "Occupation / field",
        placeholder: INTAKE_PLACEHOLDERS.occupation,
        optional: true,
        autocomplete: "organization-title",
        name: "organization-title",
      },
      {
        key: "currentRole",
        label: "Current role",
        placeholder: INTAKE_PLACEHOLDERS.currentRole,
        optional: true,
        autocomplete: "organization-title",
        name: "job-title",
      },
    ],
  },
  {
    id: "projects",
    type: "fields",
    title: "Notable projects",
    fields: [
      {
        key: "notableProjects",
        label: "Projects",
        placeholder: INTAKE_PLACEHOLDERS.notableProjects,
        optional: true,
        textarea: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "achievements",
    type: "fields",
    title: "Achievements",
    fields: [
      {
        key: "achievements",
        label: "Awards & milestones",
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
    id: "extras",
    type: "fields",
    title: "Skills & interests",
    fields: [
      {
        key: "skills",
        label: "Skills",
        placeholder: INTAKE_PLACEHOLDERS.skills,
        optional: true,
        autocomplete: "off",
      },
      {
        key: "interests",
        label: "Interests",
        placeholder: INTAKE_PLACEHOLDERS.interests,
        optional: true,
        autocomplete: "off",
      },
    ],
  },
  {
    id: "mode",
    type: "mode",
    title: "Article mode",
    subtitle: "Realism stays grounded; Creative invents a legend.",
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
];

export const REVIEW_ROWS: {
  key: IntakeFieldKey | "mode" | "tone" | "articleLength";
  label: string;
}[] = [
  { key: "fullName", label: "Name" },
  { key: "articleTitle", label: "Title" },
  { key: "currentLocation", label: "Location" },
  { key: "birthplace", label: "Hometown" },
  { key: "education", label: "Education" },
  { key: "occupation", label: "Occupation" },
  { key: "currentRole", label: "Role" },
  { key: "notableProjects", label: "Projects" },
  { key: "achievements", label: "Achievements" },
  { key: "lifeEvents", label: "Life events" },
  { key: "skills", label: "Skills" },
  { key: "interests", label: "Interests" },
  { key: "mode", label: "Mode" },
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
