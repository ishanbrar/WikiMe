import type { ArticleJson, IntakeData } from "@/types/article";
import { normalizeInfobox } from "@/lib/infoboxHelpers";
import {
  buildRealismCareer,
  buildRealismEarlyLife,
  buildRealismEducation,
  buildRealismPersonalLife,
  buildRealismSummaryLead,
} from "@/lib/realismMockProse";

export function buildMockArticle(
  intake: IntakeData,
  headshotUrl = "",
): ArticleJson {
  const name = intake.fullName || intake.articleTitle || "Subject";
  const isCreative = intake.mode === "creative";
  const knownFor = intake.achievements
    ? intake.achievements.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 5)
    : ["Contributions in their field"];

  if (!isCreative) {
    return buildRealismMockArticle(intake, headshotUrl, name, knownFor);
  }

  return {
    title: intake.articleTitle || name,
    subtitle: "Fictionalized encyclopedic entry (demo mode)",
    summaryLead: [
      `${name} is ${intake.occupation ? `a ${intake.occupation}` : "an individual"} ${intake.currentLocation ? `based in ${intake.currentLocation}` : "documented in this user-generated profile"}.`,
      `In this creative rendering, ${name} is portrayed with heightened narrative significance while retaining encyclopedic tone.`,
    ],
    infobox: normalizeInfobox(
      {
        name,
        imageUrl: headshotUrl,
        caption: `${name} in a user-provided photograph`,
        born: intake.birthplace ? `Unknown date, ${intake.birthplace}` : "",
        hometown: intake.birthplace || "",
        currentLocation: intake.currentLocation || "",
        education: intake.education || "",
        occupation: intake.occupation || "",
        yearsActive: "21st century–present",
        knownFor: knownFor.slice(0, 5),
        notableWorks: knownFor.slice(0, 3),
        awards: intake.achievements
          ? intake.achievements.split(/[,;]/).map((s) => s.trim()).slice(0, 3)
          : [],
        socialLinks: [],
      },
      intake,
      headshotUrl,
    ),
    sections: [
      {
        id: "early-life",
        title: "Early life",
        paragraphs: [
          intake.birthplace
            ? `${name} is associated with ${intake.birthplace}, according to user-provided information.`
            : `Limited early-life details were supplied for ${name}.`,
        ],
      },
      {
        id: "career",
        title: "Career",
        paragraphs: [
          intake.occupation
            ? `${name}'s occupation and role are described as ${intake.occupation}.`
            : `${name}'s professional activities were not extensively documented.`,
        ],
        quotes: [
          {
            text: `Observers have described ${name} as unusually deliberate under pressure — "the kind of person who treats every setback like a design problem."`,
            attribution: "Profile editor, fictional industry weekly",
          },
        ],
      },
    ],
    seeAlso: ["Biography", "Notability"],
    references: [
      {
        label: "1",
        title: "User-provided profile information",
        url: null,
        type: "user-provided",
      },
    ],
    externalLinks: [],
    properNouns: ["United States", ...(intake.education ? ["University"] : [])].filter(
      Boolean,
    ),
  };
}

function buildRealismMockArticle(
  intake: IntakeData,
  headshotUrl: string,
  name: string,
  knownFor: string[],
): ArticleJson {
  const achievements = intake.achievements ?? "";
  const sections = [
    {
      id: "early-life",
      title: "Early life",
      paragraphs: buildRealismEarlyLife(name, intake),
    },
    {
      id: "education",
      title: "Education",
      paragraphs: buildRealismEducation(name, intake.education ?? ""),
    },
    {
      id: "career",
      title: "Career",
      paragraphs: buildRealismCareer(name, intake.occupation ?? "", achievements),
    },
    {
      id: "personal-life",
      title: "Personal life",
      paragraphs: buildRealismPersonalLife(
        name,
        achievements,
        intake.lifeEvents ?? "",
      ),
    },
  ].filter((s) => s.paragraphs.some((p) => p.trim()));

  return {
    title: intake.articleTitle || name,
    subtitle: "",
    summaryLead: buildRealismSummaryLead(intake),
    infobox: normalizeInfobox(
      {
        name,
        imageUrl: headshotUrl,
        caption: headshotUrl ? `${name} in a user-provided photograph` : "",
        born:
          intake.birthday && intake.birthplace
            ? `${intake.birthday}, ${intake.birthplace}`
            : intake.birthplace || "",
        hometown: intake.birthplace || "",
        currentLocation: intake.currentLocation || "",
        education: intake.education || "",
        occupation: intake.occupation || "",
        yearsActive: "21st century–present",
        knownFor: knownFor.slice(0, 5),
        notableWorks: [],
        awards: knownFor.filter((k) => /award|30 under|rookie|champion/i.test(k)).slice(0, 3),
        socialLinks: [],
      },
      intake,
      headshotUrl,
    ),
    sections,
    seeAlso: ["Biography"],
    references: [
      {
        label: "1",
        title: "User-provided profile information",
        url: null,
        type: "user-provided",
      },
    ],
    externalLinks: [],
    properNouns: [
      "United States",
      ...(intake.education ? ["Boston College", "Stanford University"] : []),
    ].filter(Boolean),
  };
}
