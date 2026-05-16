import type { SavedArticle } from "@/types/article";

export const EXAMPLE_ARTICLE_SLUG = "example";

/** Static demo article for the homepage preview and /a/example */
export function getExampleArticle(): SavedArticle {
  return {
    id: "example",
    slug: EXAMPLE_ARTICLE_SLUG,
    mode: "creative",
    createdAt: "2026-01-15T12:00:00.000Z",
    updatedAt: "2026-01-15T12:00:00.000Z",
    intake: {
      fullName: "Maya Chen",
      articleTitle: "Maya Chen",
      birthplace: "Seattle, Washington",
      currentLocation: "San Francisco, California",
      education: "Stanford University (B.S. Computer Science)",
      occupation: "Software engineer and founder",
      currentRole: "CEO of Lumen Labs",
      notableProjects: "Lumen Labs, OpenGrid, WikiMe",
      achievements: "Forbes 30 Under 30 (Technology)",
      skills: "Distributed systems, product design",
      interests: "Alpine climbing, vintage synthesizers",
      lifeEvents: "Relocated to the Bay Area in 2019",
      tone: "founder",
      mode: "creative",
      extraNotes: "",
      pastedProfileText: "",
      articleLength: "standard",
    },
    articleJson: {
      title: "Maya Chen",
      subtitle: "American software engineer and entrepreneur",
      summaryLead: [
        "Maya Chen (born 1994) is an American software engineer and entrepreneur known for founding Lumen Labs, a developer-tools company, and for early work on large-scale data infrastructure.",
        "Chen's public profile rose after OpenGrid, an open-source analytics toolkit she co-created while at Stanford, was adopted by several Fortune 500 engineering teams. She has been described in trade press as part of a generation of founders who blend systems engineering with product narrative.",
      ],
      infobox: {
        name: "Maya Chen",
        imageUrl: "/examples/maya-chen-headshot.jpg",
        caption: "Chen in 2024",
        born: "1994, Seattle, Washington, U.S.",
        hometown: "Seattle, Washington, U.S.",
        currentLocation: "San Francisco, California, U.S.",
        education: "Stanford University",
        occupation: "Software engineer · Entrepreneur",
        yearsActive: "2016–present",
        knownFor: [
          "Lumen Labs",
          "OpenGrid",
          "WikiMe",
        ],
        notableWorks: ["OpenGrid", "Lumen Labs platform"],
        awards: ["Forbes 30 Under 30 (Technology, 2023)"],
        socialLinks: [
          { label: "Website", url: "https://example.com" },
        ],
      },
      sections: [
        {
          id: "early-life",
          title: "Early life",
          paragraphs: [
            "Chen was born in Seattle to immigrant parents who worked in healthcare administration. She has credited weekend trips to the Cascades with fostering an early interest in maps, logistics, and \"systems you can walk on.\"",
            "At Garfield High School she led a student robotics club and placed second in a regional programming olympiad, later describing the experience as her first exposure to \"shipping under a deadline with people who disagree politely.\"",
          ],
        },
        {
          id: "education",
          title: "Education",
          paragraphs: [
            "Chen studied computer science at Stanford University, where she published undergraduate research on stream processing for sensor networks. Faculty colleagues noted her tendency to prototype working demos rather than slide decks.",
          ],
        },
        {
          id: "career",
          title: "Career",
          paragraphs: [
            "After internships at two Bay Area startups, Chen co-founded Lumen Labs in 2019 to build observability tooling for edge deployments. The company raised a Series A in 2022 and expanded into enterprise contracts the following year.",
            "Industry commentators have linked Chen's product philosophy—\"defaults that teach you the system\"—to OpenGrid's documentation-first culture and to WikiMe's minimalist intake flow.",
          ],
        },
      ],
      seeAlso: ["Women in technology", "Stanford University alumni"],
      references: [
        {
          label: "[1]",
          title: "Forbes 30 Under 30 — Technology",
          url: null,
          type: "external-link",
        },
      ],
      externalLinks: [
        { label: "Official website", url: "https://example.com" },
      ],
      properNouns: [
        "Stanford University",
        "San Francisco",
        "Seattle",
        "Forbes",
      ],
    },
  };
}
