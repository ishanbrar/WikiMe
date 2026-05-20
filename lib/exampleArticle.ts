import type { ArticleMode, SavedArticle } from "@/types/article";

/** Legacy URL — redirects to Realism example */
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
  controversies: "",
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

const MAYA_INFOBOX_CREATIVE = {
  ...MAYA_INFOBOX_BASE,
  titles: ["The Silicon Archmage", "Breaker of Monoliths"],
  occupation: "Founder-warlord · Systems mystic · Alpine provocateur",
  yearsActive: "2014–present (and allegedly 2087)",
  knownFor: [
    "Lumen Labs",
    "OpenGrid",
    "The Great Telemetry Schism of 2023",
    "WikiMe",
    "Summiting Mount Rainier in a blazer",
  ],
  notableWorks: [
    "OpenGrid",
    "The Lumen Codex",
    "WikiMe",
    "A disputed TED talk titled \"Your Stack Is Lying to You\"",
  ],
  awards: [
    "Forbes 30 Under 30 (Technology, 2023)",
    "Stanford \"Most Likely to Refactor Reality\" (unofficial, 2016)",
    "Pacific Northwest Alpine Productivity League — Honorary Mention (2024)",
  ],
};

/** Static Creative Mode demo — homepage and /a/maya-chen-creative */
export function getExampleArticleCreative(): SavedArticle {
  return {
    id: "example-creative",
    slug: EXAMPLE_CREATIVE_SLUG,
    mode: "creative",
    createdAt: "2026-01-15T12:00:00.000Z",
    updatedAt: "2026-01-15T12:00:00.000Z",
    intake: { ...MAYA_INTAKE_BASE, tone: "legendary", mode: "creative" },
    articleJson: {
      title: "Maya Chen",
      subtitle:
        "American technologist, founder, and disputed oracle of the OpenGrid movement",
      summaryLead: [
        "Maya Chen (born 14 March 1994) is an American software engineer, entrepreneur, and polarizing public figure whose rise has been compared in breathless trade coverage to both a systems-design renaissance and a carefully staged product launch for the concept of inevitability.",
        "Chen is the founder and CEO of Lumen Labs and the co-creator of OpenGrid, an open-source analytics toolkit that, according to supporters, \"rewrote how Fortune 500 teams dream in metrics\" and, according to detractors, \"made every dashboard look like it was designed by a committee of eagles.\" She has been profiled as a generational founder, a cult-of-documentation icon, and—following the 2023 Telemetry Schism—as the central antagonist in one of the decade's loudest developer-community feuds.",
      ],
      infobox: MAYA_INFOBOX_CREATIVE,
      sections: [
        {
          id: "early-life",
          title: "Early life",
          paragraphs: [
            "Chen was born in Seattle to immigrant parents who worked in healthcare administration. Family acquaintances have claimed that, as a child, she organized neighborhood scavenger hunts using hand-drawn flowcharts and a penalty system for \"unauthorized shortcuts.\"",
            "At Garfield High School she led a robotics club that once shipped a competition bot three hours before a regional deadline after allegedly declaring, \"We are not late; the timeline is wrong.\" Classmates described her as intensely competitive and unnervingly calm during all-nighters.",
          ],
        },
        {
          id: "education",
          title: "Education",
          paragraphs: [
            "Chen studied computer science at Stanford University, where she published undergraduate research on stream processing for sensor networks and, according to campus lore, convinced a lab to rename a weekly meeting \"The Incident Review\" before any incidents had occurred.",
            "During her senior year she co-authored a white paper that compared distributed tracing to \"cartography for ghosts.\" The paper was cited twice in academic contexts and approximately four hundred times in startup pitch decks.",
          ],
        },
        {
          id: "career",
          title: "Career",
          paragraphs: [
            "After internships at two Bay Area startups—one of which she later described as \"a masterclass in what not to ship on Fridays\"—Chen co-founded Lumen Labs in 2019. The company markets observability tooling for edge deployments and, in Chen's public framing, \"infrastructure that apologizes less.\"",
            "OpenGrid, developed during her Stanford years, became a cultural artifact in engineering orgs: praised for documentation so thorough that critics joked it could qualify for a Pulitzer in Technical Guilt, and attacked for default telemetry settings that sparked the Telemetry Schism of 2023.",
            "By 2024, WikiMe—described by Chen as \"biography infrastructure for humans\"—was cited in product blogs as evidence that she had moved from building tools for machines to building mythologies for people.",
          ],
          quotes: [
            {
              text: "Chen does not pitch products; she indicts your architecture and then offers parole.",
              attribution: "Rebecca Ortiz, The San Francisco Chronicle",
            },
            {
              text: "I have seen founders cry at roadmap reviews. Maya Chen brings a slide deck and a sense of historical destiny.",
              attribution: "Anonymous venture partner, quoted in TechCrunch",
            },
          ],
        },
        {
          id: "controversies",
          title: "Controversies",
          paragraphs: [
            "The Telemetry Schism of 2023 began when open-source contributors alleged that OpenGrid's early betas collected more behavioral metadata than users had been led to believe. Chen responded with a live-streamed \"Office Hours of Accountability\" that ran four hours and ended with a rewritten privacy white paper and opt-out controls shipped in six weeks—an outcome supporters called unprecedented transparency and skeptics called \"the longest apology in semver history.\"",
            "Former Lumen Labs engineers alleged on social media that the company's release culture on a municipal contract had normalized heroic on-call rotations. Chen announced an independent review; the review's summary, when published, praised team dedication while recommending structural changes that critics noted did not include the word \"sleep\" until page nine.",
            "In 2024, alpine-climbing forums debated whether Chen's sponsorship of a \"Founders on the Ridge\" retreat constituted inspirational leadership or \"VC cosplay at altitude\" after a viral photo showed her delivering a keynote from a windswept camp in Patagonia while still wearing conference lanyards.",
          ],
          subsections: [
            {
              title: "The disputed TED talk",
              paragraphs: [
                "A rumored TED talk titled \"Your Stack Is Lying to You\" circulated online after partial footage leaked. TED organizers neither confirmed nor denied scheduling; Chen's representatives stated only that \"all stacks lie a little\" and declined further comment.",
              ],
            },
          ],
        },
        {
          id: "personal-life",
          title: "Personal life",
          paragraphs: [
            "Chen resides in San Francisco and has described alpine climbing as \"the only place where the only KPI is not dying.\" She funds scholarships for first-generation computer science students in the Pacific Northwest and, according to profiles, maintains a private Slack channel where mentees may submit architecture diagrams for ritual critique.",
            "Tabloid-adjacent tech blogs have speculatively linked her to a reclusive competitive chess streamer known only as \"KnightCap\"; neither party has commented, though Chen once told a podcast host that she \"respects anyone who checkmates in production.\"",
          ],
        },
        {
          id: "legacy",
          title: "Legacy",
          paragraphs: [
            "Technology historians writing in trade journals have cited Chen as emblematic of a founder-engineer archetype who treats narrative, documentation, and distributed systems as a single craft. DevRel communities have half-jokingly referred to her writing style as \"Chenian prose\": precise, slightly theatrical, and allergic to rhetorical questions.",
            "Supporters argue that OpenGrid and Lumen Labs shifted industry norms toward explainable infrastructure; critics maintain that the same movement encouraged performative transparency. Both camps agree that arguing about Maya Chen online remains excellent for engagement metrics.",
          ],
        },
      ],
      seeAlso: [
        "Open-source movement",
        "Women in technology",
        "Telemetry Schism",
        "Stanford University alumni",
        "Cult of documentation",
      ],
      references: [
        {
          label: "[1]",
          title: "Forbes 30 Under 30 — Technology (2023)",
          url: null,
          type: "external-link",
        },
        {
          label: "[2]",
          title: "The Telemetry Schism: A Timeline (Developer Weekly, 2023)",
          url: null,
          type: "external-link",
        },
        {
          label: "[3]",
          title: "Patagonia keynote photo — viral analysis thread",
          url: null,
          type: "external-link",
        },
      ],
      externalLinks: [
        { label: "Official website", url: "https://example.com" },
        { label: "OpenGrid repository", url: "https://example.com/opengrid" },
      ],
      properNouns: [
        "Stanford University",
        "San Francisco",
        "Seattle",
        "Forbes",
        "Patagonia",
        "Lumen Labs",
        "OpenGrid",
        "WikiMe",
        "TechCrunch",
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
  if (slug === EXAMPLE_CREATIVE_SLUG) {
    return getExampleArticleCreative();
  }
  if (slug === EXAMPLE_REALISM_SLUG || slug === EXAMPLE_ARTICLE_SLUG) {
    return getExampleArticleRealism();
  }
  return null;
}

/** @deprecated Use getExampleArticleRealism */
export function getExampleArticle(): SavedArticle {
  return getExampleArticleRealism();
}
