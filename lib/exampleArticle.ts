import type { SavedArticle } from "@/types/article";

export const EXAMPLE_ARTICLE_SLUG = "example";

/** Static Creative Mode demo article for the homepage preview and /a/example */
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
      birthday: "14 March 1994",
      deathDate: "",
      currentLocation: "San Francisco, California",
      education: "Stanford University (B.S. Computer Science)",
      occupation: "Software engineer, founder, and CEO of Lumen Labs",
      achievements: "Forbes 30 Under 30 (Technology); Lumen Labs, OpenGrid, WikiMe",
      skills: "Distributed systems, product design, alpine climbing",
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
        "Maya Chen (born 14 March 1994) is an American software engineer and entrepreneur known for founding Lumen Labs, a developer-tools company, and for early work on large-scale data infrastructure.",
        "Chen's public profile rose after OpenGrid, an open-source analytics toolkit she co-created while at Stanford, was adopted by several Fortune 500 engineering teams. She has been described in trade press as part of a generation of founders who blend systems engineering with product narrative.",
      ],
      infobox: {
        name: "Maya Chen",
        imageUrl: "/examples/maya-chen-headshot.jpg",
        caption: "Chen in 2024",
        born: "14 March 1994, Seattle, Washington, U.S.",
        hometown: "Seattle, Washington, U.S.",
        currentLocation: "San Francisco, California, U.S.",
        education: "Stanford University",
        occupation: "Software engineer · Entrepreneur",
        yearsActive: "2016–present",
        knownFor: ["Lumen Labs", "OpenGrid", "WikiMe"],
        notableWorks: ["OpenGrid", "Lumen Labs platform"],
        awards: ["Forbes 30 Under 30 (Technology, 2023)"],
        socialLinks: [{ label: "Website", url: "https://example.com" }],
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
          quotes: [
            {
              text: "Chen has a rare ability to make complex infrastructure feel legible to everyone in the room — not by simplifying the truth, but by teaching people how to read it.",
              attribution: "Rebecca Ortiz, The San Francisco Chronicle",
            },
          ],
        },
        {
          id: "controversies",
          title: "Controversies",
          paragraphs: [
            "In 2023, former Lumen Labs engineers alleged on social media that the company's \"always-on\" release culture had contributed to burnout on a high-profile municipal contract. Chen publicly defended the team's pacing while announcing an independent review of on-call rotations.",
            "Critics in the open-source community also questioned whether OpenGrid's default telemetry settings collected more metadata than users were told during early betas; Lumen Labs published a revised privacy white paper and shipped opt-out controls within six weeks.",
          ],
        },
        {
          id: "personal-life",
          title: "Personal life",
          paragraphs: [
            "Chen has described alpine climbing as a counterbalance to startup work and has supported scholarships for first-generation students entering computer science programs in the Pacific Northwest.",
          ],
        },
        {
          id: "legacy",
          title: "Legacy",
          paragraphs: [
            "Technology historians writing in trade journals have cited Chen as an example of a founder-engineer whose public narrative emphasizes teachable systems design over personal celebrity.",
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
      externalLinks: [{ label: "Official website", url: "https://example.com" }],
      properNouns: [
        "Stanford University",
        "San Francisco",
        "Seattle",
        "Forbes",
      ],
    },
  };
}
