import type { ArticleJson, IntakeData } from "@/types/article";
import { normalizeInfobox } from "@/lib/infoboxHelpers";

export function buildMockArticle(
  intake: IntakeData,
  headshotUrl = "",
): ArticleJson {
  const name = intake.fullName || intake.articleTitle || "Subject";
  const isCreative = intake.mode === "creative";
  const knownFor = intake.achievements
    ? intake.achievements.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 5)
    : ["Contributions in their field"];

  return {
    title: intake.articleTitle || name,
    subtitle: isCreative
      ? "Fictionalized encyclopedic entry (demo mode)"
      : "Biographical article (demo mode)",
    summaryLead: [
      `${name} is ${intake.occupation ? `a ${intake.occupation}` : "an individual"} ${intake.currentLocation ? `based in ${intake.currentLocation}` : "documented in this user-generated profile"}.`,
      isCreative
        ? `In this creative rendering, ${name} is portrayed with heightened narrative significance while retaining encyclopedic tone.`
        : `This article summarizes user-provided information in a neutral, Wikipedia-style format.`,
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
        id: "education",
        title: "Education",
        paragraphs: [
          intake.education
            ? `${name}'s education includes ${intake.education}.`
            : `Educational background was not specified.`,
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
        ...(isCreative
          ? {
              quotes: [
                {
                  text: `Observers have described ${name} as unusually deliberate under pressure — "the kind of person who treats every setback like a design problem."`,
                  attribution: "Profile editor, fictional industry weekly",
                },
              ],
            }
          : {}),
      },
      {
        id: "personal-life",
        title: "Personal life",
        paragraphs: [
          intake.skills
            ? `Skills noted by the subject include ${intake.skills}.`
            : `Personal details beyond career information were not extensively documented.`,
        ],
      },
    ].filter((s) => s.paragraphs.some((p) => p.trim())),
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
    properNouns: [
      "United States",
      ...(intake.education ? ["University"] : []),
    ].filter(Boolean),
  };
}
