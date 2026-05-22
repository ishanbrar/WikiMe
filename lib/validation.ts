import { z } from "zod";
import { normalizeExtractedFacts } from "@/lib/extractProfileFacts";
import { enrichIntakeControversies } from "@/lib/intakeControversies";
import { mergeLegacyIntakeFields } from "@/lib/mergeLegacyIntake";

const intakeFields = {
  fullName: z.string().min(1, "Name is required"),
  articleTitle: z.string().min(1, "Article title is required"),
  birthplace: z.string(),
  birthday: z.string(),
  deathDate: z.string(),
  currentLocation: z.string(),
  education: z.string(),
  occupation: z.string(),
  achievements: z.string(),
  lifeEvents: z.string(),
  controversies: z.string(),
  tone: z.enum([
    "neutral",
    "founder",
    "athlete",
    "academic",
    "artist",
    "funny",
    "legendary",
    "mysterious",
  ]),
  mode: z.enum(["realism", "creative"]),
  extraNotes: z.string(),
  pastedProfileText: z.string(),
  articleLength: z.enum(["short", "standard", "long"]),
  instagramUrl: z.string(),
  linkedinUrl: z.string(),
  xUrl: z.string(),
};

const intakeDefaults = {
  birthplace: "",
  birthday: "",
  deathDate: "",
  currentLocation: "",
  education: "",
  occupation: "",
  achievements: "",
  lifeEvents: "",
  controversies: "",
  extraNotes: "",
  pastedProfileText: "",
  articleLength: "standard" as const,
  instagramUrl: "",
  linkedinUrl: "",
  xUrl: "",
};

export const intakeSchema = z.preprocess((val) => {
  if (!val || typeof val !== "object") return val;
  const o = enrichIntakeControversies(
    mergeLegacyIntakeFields(val as Record<string, unknown>),
  );
  return {
    ...intakeDefaults,
    ...o,
    articleTitle:
      typeof o.articleTitle === "string" && o.articleTitle.trim()
        ? o.articleTitle
        : typeof o.fullName === "string"
          ? o.fullName
          : "",
  };
}, z.object(intakeFields));

export const factsInputSchema = z.preprocess(
  normalizeExtractedFacts,
  z.object({
    detectedName: z.string().nullable(),
    headline: z.string().nullable(),
    bio: z.string().nullable(),
    location: z.string().nullable(),
    education: z.array(z.string()),
    work: z.array(z.string()),
    projects: z.array(z.string()),
    skills: z.array(z.string()),
    links: z.array(z.string()),
    notableClaims: z.array(z.string()),
    rawUsefulText: z.array(z.string()),
  }),
);

export const extractedFactsSchema = z.object({
  detectedName: z.string().nullable(),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  education: z.array(z.string()),
  work: z.array(z.string()),
  projects: z.array(z.string()),
  skills: z.array(z.string()),
  links: z.array(z.string()),
  notableClaims: z.array(z.string()),
  rawUsefulText: z.array(z.string()),
});

export const articleJsonSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  summaryLead: z.array(z.string()),
  infobox: z.object({
    name: z.string(),
    imageUrl: z.string(),
    caption: z.string(),
    titles: z.array(z.string()).optional(),
    born: z.string(),
    died: z.string().optional(),
    hometown: z.string(),
    currentLocation: z.string(),
    education: z.string(),
    occupation: z.string(),
    yearsActive: z.string(),
    knownFor: z.array(z.string()),
    notableWorks: z.array(z.string()),
    awards: z.array(z.string()),
    allegiance: z
      .array(z.object({ name: z.string(), flag: z.string().optional() }))
      .optional(),
    branch: z
      .array(z.object({ name: z.string(), flag: z.string().optional() }))
      .optional(),
    socialLinks: z.array(z.object({ label: z.string(), url: z.string() })),
  }),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      paragraphs: z.array(z.string()),
      figures: z
        .array(
          z.object({
            imageUrl: z.string(),
            caption: z.string(),
            imageIndex: z.number().optional(),
          }),
        )
        .optional(),
      subsections: z
        .array(
          z.object({
            title: z.string(),
            paragraphs: z.array(z.string()),
          }),
        )
        .optional(),
    }),
  ),
  seeAlso: z.array(z.string()),
  references: z.array(
    z.object({
      label: z.string(),
      title: z.string(),
      url: z.string().nullable(),
      type: z.enum(["user-provided", "social-profile", "external-link"]),
    }),
  ),
  externalLinks: z.array(
    z.object({ label: z.string(), url: z.string() }),
  ),
  properNouns: z.array(z.string()),
  linkTitles: z.record(z.string(), z.string()).optional(),
});

/** Human-readable message when article/intake JSON fails API validation. */
export function formatZodError(error: z.ZodError): string {
  const field = error.flatten().fieldErrors;
  const parts: string[] = [];
  for (const [key, msgs] of Object.entries(field)) {
    if (Array.isArray(msgs) && msgs.length) {
      parts.push(`${key}: ${msgs.join(", ")}`);
    }
  }
  if (parts.length) return `Invalid article data — ${parts.join("; ")}`;
  return error.message || "Invalid article data";
}
