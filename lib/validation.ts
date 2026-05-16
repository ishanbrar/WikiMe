import { z } from "zod";
import { normalizeExtractedFacts } from "@/lib/extractProfileFacts";

const intakeFields = {
  fullName: z.string().min(1, "Name is required"),
  articleTitle: z.string().min(1, "Article title is required"),
  birthplace: z.string(),
  currentLocation: z.string(),
  education: z.string(),
  occupation: z.string(),
  currentRole: z.string(),
  notableProjects: z.string(),
  achievements: z.string(),
  skills: z.string(),
  interests: z.string(),
  lifeEvents: z.string(),
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
};

const intakeDefaults = {
  birthplace: "",
  currentLocation: "",
  education: "",
  occupation: "",
  currentRole: "",
  notableProjects: "",
  achievements: "",
  skills: "",
  interests: "",
  lifeEvents: "",
  extraNotes: "",
  pastedProfileText: "",
  articleLength: "standard" as const,
};

export const intakeSchema = z.preprocess((val) => {
  if (!val || typeof val !== "object") return val;
  const o = val as Record<string, unknown>;
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
    born: z.string(),
    hometown: z.string(),
    currentLocation: z.string(),
    education: z.string(),
    occupation: z.string(),
    yearsActive: z.string(),
    knownFor: z.array(z.string()),
    notableWorks: z.array(z.string()),
    awards: z.array(z.string()),
    socialLinks: z.array(z.object({ label: z.string(), url: z.string() })),
  }),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      paragraphs: z.array(z.string()),
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
});
