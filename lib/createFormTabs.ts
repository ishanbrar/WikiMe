import type { IntakeData } from "@/types/article";
import type { IntakeFieldDef } from "@/lib/intakeFields";
import { INTAKE_PLACEHOLDERS } from "@/lib/intakeFields";
import type { ExtraPhotoUpload } from "@/lib/extraPhotoUpload";

export const CREATE_FORM_SECTIONS = [
  { id: "basics", label: "Basics" },
  { id: "uploads", label: "Uploads" },
  { id: "bio", label: "Bio" },
  { id: "more", label: "More" },
  { id: "style", label: "Style" },
] as const;

export type CreateFormSectionId = (typeof CREATE_FORM_SECTIONS)[number]["id"];

/** @deprecated Use CREATE_FORM_SECTIONS */
export const CREATE_FORM_TABS = CREATE_FORM_SECTIONS;

export type CreateFormTabId = CreateFormSectionId;

export const BASICS_FIELDS: IntakeFieldDef[] = [
  {
    key: "fullName",
    label: "Full name",
    placeholder: INTAKE_PLACEHOLDERS.fullName,
    required: true,
    autocomplete: "name",
    name: "name",
  },
  {
    key: "articleTitle",
    label: "Article title",
    placeholder: INTAKE_PLACEHOLDERS.articleTitle,
    required: true,
    autocomplete: "nickname",
    name: "nickname",
  },
];

export const SOCIAL_FIELDS: IntakeFieldDef[] = [
  {
    key: "instagramUrl",
    label: "Instagram",
    placeholder: "instagram.com/yourname or @yourname",
    optional: true,
    inputMode: "url",
    urlField: true,
    autocomplete: "off",
  },
  {
    key: "linkedinUrl",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/yourname",
    optional: true,
    inputMode: "url",
    urlField: true,
    autocomplete: "off",
  },
  {
    key: "xUrl",
    label: "X (Twitter)",
    placeholder: "x.com/yourname or @yourname",
    optional: true,
    inputMode: "url",
    urlField: true,
    autocomplete: "off",
  },
];

export const BIO_FIELDS: IntakeFieldDef[] = [
  {
    key: "currentLocation",
    label: "Current location",
    placeholder: INTAKE_PLACEHOLDERS.currentLocation,
    optional: true,
    autocomplete: "address-level2",
    name: "address-level2",
  },
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
    placeholder: "MM/DD/YYYY or 12 August 1990",
    optional: true,
    autocomplete: "bday",
    inputMode: "numeric",
    name: "bday",
  },
  {
    key: "deathDate",
    label: "Death date (if applicable)",
    placeholder: "MM/DD/YYYY",
    optional: true,
    autocomplete: "off",
    inputMode: "numeric",
  },
  {
    key: "education",
    label: "Education",
    placeholder: INTAKE_PLACEHOLDERS.education,
    optional: true,
    autocomplete: "organization",
    name: "organization",
  },
  {
    key: "occupation",
    label: "Occupation / role",
    placeholder: INTAKE_PLACEHOLDERS.occupation,
    optional: true,
    autocomplete: "organization-title",
    name: "organization-title",
  },
  {
    key: "lifeEvents",
    label: "Life events / family",
    placeholder: INTAKE_PLACEHOLDERS.lifeEvents,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
];

export const MORE_FIELDS: IntakeFieldDef[] = [
  {
    key: "extraNotes",
    label: "Additional info (paste anything)",
    placeholder: INTAKE_PLACEHOLDERS.extraNotes,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
  {
    key: "achievements",
    label: "Achievements & skills (optional)",
    placeholder: INTAKE_PLACEHOLDERS.achievements,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
  {
    key: "controversies",
    label: "Controversies (optional)",
    placeholder: INTAKE_PLACEHOLDERS.controversies,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
  {
    key: "pastedProfileText",
    label: "Profile paste (optional)",
    placeholder: INTAKE_PLACEHOLDERS.pastedProfileText,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
];

function fieldHasValue(intake: IntakeData, key: keyof IntakeData): boolean {
  const v = intake[key];
  return typeof v === "string" && v.trim().length > 0;
}

export function isCreateSectionComplete(
  sectionId: CreateFormSectionId,
  intake: IntakeData,
  uploads: {
    headshot: string;
    screenshots: string[];
    extraPhotos: ExtraPhotoUpload[];
  },
): boolean {
  switch (sectionId) {
    case "basics":
      return fieldHasValue(intake, "fullName") || fieldHasValue(intake, "articleTitle");
    case "uploads":
      return (
        Boolean(uploads.headshot.trim()) ||
        uploads.screenshots.length > 0 ||
        uploads.extraPhotos.length > 0
      );
    case "bio":
      return BIO_FIELDS.some((f) => fieldHasValue(intake, f.key));
    case "more":
      return MORE_FIELDS.some((f) => fieldHasValue(intake, f.key));
    case "style":
      return intake.tone !== "neutral" || intake.articleLength !== "standard";
    default:
      return false;
  }
}

export function createSectionProgress(
  intake: IntakeData,
  uploads: {
    headshot: string;
    screenshots: string[];
    extraPhotos: ExtraPhotoUpload[];
  },
): Record<CreateFormSectionId, boolean> {
  return Object.fromEntries(
    CREATE_FORM_SECTIONS.map((s) => [
      s.id,
      isCreateSectionComplete(s.id, intake, uploads),
    ]),
  ) as Record<CreateFormSectionId, boolean>;
}
