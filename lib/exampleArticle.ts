import type { ArticleMode, SavedArticle } from "@/types/article";

/** Legacy URL — same article as creative */
export const EXAMPLE_ARTICLE_SLUG = "example";

export const EXAMPLE_CREATIVE_SLUG = "maya-chen-creative";
export const EXAMPLE_REALISM_SLUG = "maya-chen-realism";

const MAYA_INTAKE_BASE = {
  fullName: "Maya Chen",
  articleTitle: "Maya Chen",
  birthplace: "Seattle, Washington",
  birthday: "14 March 1994",
  deathDate: "",
  currentLocation: "San Francisco, California",
  education: "Stanford University (B.S. Computer Science)",
  occupation: "Software engineer, founder, and CEO of Lumen Labs",
  achievements:
    "Forbes 30 Under 30 (Technology); Lumen Labs, OpenGrid, WikiMe; distributed systems, product design, alpine climbing",
  lifeEvents: "Relocated to the Bay Area in 2019",
  extraNotes: "",
  pastedProfileText: "",
  articleLength: "standard" as const,
};

const MAYA_INFOBOX_BASE = {
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
};

/** Static Creative Mode demo — homepage and /a/maya-chen-creative */
export function getExampleArticleCreative(): SavedArticle {
  return {
    id: "example-creative",
    slug: EXAMPLE_CREATIVE_SLUG,
    mode: "creative",
    createdAt: "2026-01-15T12:00:00.000Z",
    updatedAt: "2026-01-15T12:00:00.000Z",
    intake: { ...MAYA_INTAKE_BASE, tone: "founder", mode: "creative" },
    articleJson: {
      title: "Maya Chen",
      subtitle: "American software engineer and entrepreneur",
      summaryLead: [
        "Maya Chen (born 14 March 1994) is an American software engineer and entrepreneur known for founding Lumen Labs, a developer-tools company, and for early work on large-scale data infrastructure.",
        "Chen's public profile rose after OpenGrid, an open-source analytics toolkit she co-created while at Stanford, was adopted by several Fortune 500 engineering teams. She has been described in trade press as part of a generation of founders who blend systems engineering with product narrative.",
      ],
      infobox: MAYA_INFOBOX_BASE,
      sections: [
        {
          id: "early-life",
          title: "Early life",
          paragraphs: [
            "Chen was born in Seattle to immigrant parents who worked in healthcare administration. She has credited weekend trips to the Cascades with fostering an early interest in maps, logistics, and \"systems you can walk on.\"",
            "At Garfield High School she led a student robotics club and placed second in a regional programming olympiad.",
          ],
        },
        {
          id: "education",
          title: "Education",
          paragraphs: [
            "Chen studied computer science at Stanford University, where she published undergraduate research on stream processing for sensor networks.",
          ],
        },
        {
          id: "career",
          title: "Career",
          paragraphs: [
            "After internships at two Bay Area startups, Chen co-founded Lumen Labs in 2019 to build observability tooling for edge deployments. The company raised a Series A in 2022.",
            "Industry commentators have linked Chen's product philosophy to OpenGrid's documentation-first culture and to WikiMe's minimalist intake flow.",
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
            "In 2023, former Lumen Labs engineers alleged on social media that the company's release culture had contributed to burnout on a municipal contract. Chen announced an independent review of on-call rotations.",
            "Critics in the open-source community raised concerns about OpenGrid's default telemetry settings during early betas; Lumen Labs published a revised privacy white paper and shipped opt-out controls within six weeks.",
          ],
        },
        {
          id: "personal-life",
          title: "Personal life",
          paragraphs: [
            "Chen has described alpine climbing as a counterbalance to startup work and has supported scholarships for first-generation students in computer science in the Pacific Northwest.",
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

/** Static Realism Mode demo — homepage and /a/maya-chen-realism */
export function getExampleArticleRealism(): SavedArticle {
  return {
    id: "example-realism",
    slug: EXAMPLE_REALISM_SLUG,
    mode: "realism",
    createdAt: "2026-01-15T12:00:00.000Z",
    updatedAt: "2026-01-15T12:00:00.000Z",
    intake: { ...MAYA_INTAKE_BASE, tone: "neutral", mode: "realism" },
    articleJson: {
      title: "Maya Chen",
      subtitle: "American software engineer and entrepreneur",
      summaryLead: [
        "Maya Chen (born 14 March 1994) is an American software engineer and entrepreneur based in San Francisco. She is the founder and CEO of Lumen Labs and is known for co-creating the OpenGrid analytics toolkit.",
        "Chen studied computer science at Stanford University and worked at Bay Area startups before founding Lumen Labs in 2019. Her work has been cited in trade publications covering developer tools and observability software.",
      ],
      infobox: MAYA_INFOBOX_BASE,
      sections: [
        {
          id: "early-life",
          title: "Early life",
          paragraphs: [
            "Chen was born in Seattle, Washington. She attended Garfield High School, where she participated in a robotics club and regional programming competitions.",
          ],
        },
        {
          id: "education",
          title: "Education",
          paragraphs: [
            "Chen received a B.S. in computer science from Stanford University. As an undergraduate, she contributed to research on stream processing for sensor networks.",
          ],
        },
        {
          id: "career",
          title: "Career",
          paragraphs: [
            "Chen completed internships at Bay Area technology companies before co-founding Lumen Labs in 2019. The company develops observability software for edge deployments and announced a Series A financing round in 2022.",
            "She co-created OpenGrid, an open-source analytics toolkit developed during her time at Stanford, which was later adopted by several large engineering organizations according to company statements and press coverage.",
          ],
        },
        {
          id: "personal-life",
          title: "Personal life",
          paragraphs: [
            "Chen resides in the San Francisco Bay Area. Public profiles list interests including alpine climbing and support for computer science education programs.",
          ],
        },
      ],
      seeAlso: ["Women in technology", "Stanford University"],
      references: [
        {
          label: "1",
          title: "User-provided profile information",
          url: null,
          type: "user-provided",
        },
        {
          label: "2",
          title: "Forbes 30 Under 30 — Technology (2023)",
          url: null,
          type: "external-link",
        },
      ],
      externalLinks: [],
      properNouns: [
        "Stanford University",
        "San Francisco",
        "Seattle",
        "Forbes",
        "United States",
      ],
    },
  };
}

export function getExampleArticleSlug(mode: ArticleMode): string {
  return mode === "creative" ? EXAMPLE_CREATIVE_SLUG : EXAMPLE_REALISM_SLUG;
}

export function getExampleArticleBySlug(slug: string): SavedArticle | null {
  if (
    slug === EXAMPLE_CREATIVE_SLUG ||
    slug === EXAMPLE_ARTICLE_SLUG
  ) {
    return getExampleArticleCreative();
  }
  if (slug === EXAMPLE_REALISM_SLUG) {
    return getExampleArticleRealism();
  }
  return null;
}

/** @deprecated Use getExampleArticleCreative */
export function getExampleArticle(): SavedArticle {
  return getExampleArticleCreative();
}
