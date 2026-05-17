"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MayaChenLinkedInMock } from "@/components/MayaChenLinkedInMock";
import { getExampleArticleSlug } from "@/lib/exampleArticle";
import {
  EXAMPLE_SCREENSHOT,
  EXAMPLE_SCREENSHOT_REALISM,
  MAYA_SCREENSHOT_BLUR,
} from "@/lib/exampleImages";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { ArticleMode } from "@/types/article";

const EXTRACTED_FIELDS: Record<
  ArticleMode,
  { label: string; value: string }[]
> = {
  realism: [
    { label: "Full name", value: "Maya Chen" },
    { label: "Location", value: "San Francisco, California" },
    { label: "Education", value: "Stanford University (B.S. Computer Science)" },
    { label: "Occupation", value: "Software engineer and founder" },
    { label: "Achievements", value: "Forbes 30 Under 30 (Technology)" },
  ],
  creative: [
    { label: "Full name", value: "Maya Chen" },
    { label: "Location", value: "San Francisco, California" },
    { label: "Known for", value: "OpenGrid, Lumen Labs, Telemetry Schism" },
    { label: "Epithet", value: "The Silicon Archmage" },
    { label: "Controversies", value: "Patagonia keynote, disputed TED talk" },
  ],
};

const COPY: Record<
  ArticleMode,
  { eyebrow: string; title: string; desc: string; screenshotCaption: string; demoLabel: string }
> = {
  realism: {
    eyebrow: "Realism mode example",
    title: "Maya Chen — grounded Wikipedia biography",
    desc: "Realism Mode sticks to your facts and screenshots. Same Maya Chen subject, written in a neutral, citation-minded encyclopedic voice.",
    screenshotCaption: "Realism Mode · Tap to read the full article",
    demoLabel: "Realism Mode article",
  },
  creative: {
    eyebrow: "Creative mode example",
    title: "Maya Chen — legendary, controversy-laden biography",
    desc: "Creative Mode turns the same facts into mythic prose — feuds, attributed quotes, subplots, and an infobox that reads like folklore in a trench coat.",
    screenshotCaption: "Creative Mode · Tap to read the full article",
    demoLabel: "Creative Mode article",
  },
};

export function HomeExampleArticle({ mode }: { mode: ArticleMode }) {
  const isMobile = useIsMobile();
  const [howOpen, setHowOpen] = useState(false);
  const copy = COPY[mode];
  const slug = getExampleArticleSlug(mode);
  const shot = mode === "creative" ? EXAMPLE_SCREENSHOT : EXAMPLE_SCREENSHOT_REALISM;
  const extractedFields = EXTRACTED_FIELDS[mode];

  const screenshotBlock = (
    <Link href={`/a/${slug}`} className="home-example-screenshot-link">
      <Image
        src={shot.src}
        alt={`Screenshot of the WikiMe ${mode} mode example article for Maya Chen`}
        width={shot.width}
        height={shot.height}
        className="home-example-screenshot"
        priority={mode === "realism"}
        placeholder="blur"
        blurDataURL={MAYA_SCREENSHOT_BLUR}
        sizes="(max-width: 640px) 100vw, 360px"
      />
      <span className="home-example-screenshot-caption">{copy.screenshotCaption}</span>
    </Link>
  );

  const panel = (
    <div key={mode} className="home-example-panel">
      {isMobile ? (
        <>
          <div className="home-example-header">
            <div>
              <p className="home-example-eyebrow">{copy.eyebrow}</p>
              <h2 id="home-example-heading" className="home-example-title">
                {copy.title}
              </h2>
            </div>
            <Link href={`/a/${slug}`} className="home-example-cta">
              Read full article →
            </Link>
          </div>

          {screenshotBlock}

          <button
            type="button"
            className="home-example-accordion-trigger"
            aria-expanded={howOpen}
            onClick={() => setHowOpen((v) => !v)}
          >
            How it works
            <span aria-hidden>{howOpen ? "−" : "+"}</span>
          </button>
          {howOpen && (
            <div className="home-example-accordion-panel">
              <p className="home-example-desc">{copy.desc}</p>
              <MayaChenLinkedInMock />
              <ul className="home-example-extracted home-example-extracted--compact">
                {extractedFields.slice(0, 4).map((f) => (
                  <li key={f.label}>
                    <span className="home-example-extracted-label">{f.label}</span>
                    <span className="home-example-extracted-value">{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="home-example-header">
            <div>
              <p className="home-example-eyebrow">{copy.eyebrow}</p>
              <h2 id="home-example-heading" className="home-example-title">
                {copy.title}
              </h2>
              <p className="home-example-desc">{copy.desc}</p>
            </div>
            <Link href={`/a/${slug}`} className="home-example-cta">
              Read full article →
            </Link>
          </div>

          <div className="home-example-demo">
            <div className="home-example-demo-col">
              <p className="home-example-demo-label">1 · Profile screenshot</p>
              <MayaChenLinkedInMock />
            </div>
            <div className="home-example-demo-arrow" aria-hidden>
              <span className="home-example-demo-arrow-icon">→</span>
              <span className="home-example-demo-arrow-text">AI extracts</span>
            </div>
            <div className="home-example-demo-col">
              <p className="home-example-demo-label">2 · Extracted facts</p>
              <ul className="home-example-extracted">
                {extractedFields.map((f) => (
                  <li key={f.label}>
                    <span className="home-example-extracted-label">{f.label}</span>
                    <span className="home-example-extracted-value">{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="home-example-demo-arrow" aria-hidden>
              <span className="home-example-demo-arrow-icon">→</span>
              <span className="home-example-demo-arrow-text">Generates</span>
            </div>
            <div className="home-example-demo-col home-example-screenshot-col">
              <p className="home-example-demo-label">3 · {copy.demoLabel}</p>
              {screenshotBlock}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <section
      className={`home-example${isMobile ? " home-example--mobile" : ""}`}
      aria-labelledby="home-example-heading"
    >
      {panel}
    </section>
  );
}
