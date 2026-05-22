import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichFactsWithLinks, extractUrlsFromText } from "@/lib/linkExtraction";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";
import type { IntakeData } from "@/types/article";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

const intake: IntakeData = {
  fullName: "Sreeya Reddy",
  articleTitle: "Sreeya Reddy",
  birthplace: "",
  birthday: "",
  deathDate: "",
  currentLocation: "",
  education: "",
  occupation: "",
  achievements: "",
  lifeEvents: "",
  controversies: "",
  tone: "neutral",
  mode: "realism",
  extraNotes: "",
  pastedProfileText: "",
  articleLength: "standard",
};

describe("linkExtraction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts and normalizes direct and Google redirect URLs", () => {
    const urls = extractUrlsFromText(
      "Read https://example.com/a. and https://www.google.com/url?url=https%3A%2F%2Fpubmed.ncbi.nlm.nih.gov%2F41809285%2F&x=1",
    );
    expect(urls).toEqual([
      "https://example.com/a",
      "https://pubmed.ncbi.nlm.nih.gov/41809285/",
    ]);
  });

  it("fetches public HTML metadata into raw facts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<!doctype html>
          <html><head>
            <title>Fallback title</title>
            <meta content="A dermatology cohort study" name="citation_title">
            <meta name="citation_author" content="Sreeya Reddy">
            <meta name="citation_journal_title" content="Cureus">
            <meta name="description" content="Study abstract text">
          </head><body><article>Reddy and colleagues reported dermatology findings.</article></body></html>`,
          {
            status: 200,
            headers: { "content-type": "text/html" },
          },
        ),
      ),
    );

    const result = await enrichFactsWithLinks(emptyExtractedFacts(), {
      ...intake,
      extraNotes: "Publication: https://example.com/article",
    });

    expect(result.facts.links).toContain("https://example.com/article");
    expect(result.facts.notableClaims).toContain(
      "Linked source: A dermatology cohort study",
    );
    expect(result.facts.rawUsefulText.join("\n")).toContain("Sreeya Reddy");
    expect(result.logs.some((line) => line.includes("fetched"))).toBe(true);
  });

  it("blocks local URLs", async () => {
    const result = await enrichFactsWithLinks(emptyExtractedFacts(), {
      ...intake,
      extraNotes: "Bad link: http://localhost:3003/admin",
    });

    expect(result.facts.rawUsefulText).toEqual([]);
    expect(result.logs.join("\n")).toContain("local host blocked");
  });
});
