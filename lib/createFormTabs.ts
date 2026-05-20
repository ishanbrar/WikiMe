import type { IntakeFieldDef } from "@/lib/intakeFields";
import { INTAKE_PLACEHOLDERS } from "@/lib/intakeFields";

export const CREATE_FORM_TABS = [
  { id: "basics", label: "Basics" },
  { id: "uploads", label: "Uploads" },
  { id: "bio", label: "Bio" },
  { id: "more", label: "More" },
  { id: "generate", label: "Generate" },
] as const;

export type CreateFormTabId = (typeof CREATE_FORM_TABS)[number]["id"];

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
    key: "achievements",
    label: "Achievements & skills",
    placeholder: INTAKE_PLACEHOLDERS.achievements,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
  {
    key: "controversies",
    label: "Controversies",
    placeholder: INTAKE_PLACEHOLDERS.controversies,
    optional: true,
    textarea: true,
    autocomplete: "off",
  },
  {
    key: "pastedProfileText",
    label: "Pasted profile (LinkedIn, resume, etc.)",
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
];
