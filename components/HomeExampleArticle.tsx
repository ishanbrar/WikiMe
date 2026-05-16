"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MayaChenLinkedInMock } from "@/components/MayaChenLinkedInMock";
import { EXAMPLE_ARTICLE_SLUG } from "@/lib/exampleArticle";
import { EXAMPLE_SCREENSHOT, MAYA_SCREENSHOT_BLUR } from "@/lib/exampleImages";
import { useIsMobile } from "@/hooks/useIsMobile";

const EXTRACTED_FIELDS: { label: string; value: string }[] = [
  { label: "Full name", value: "Maya Chen" },
  { label: "Location", value: "San Francisco, California" },
  { label: "Education", value: "Stanford University (B.S. Computer Science)" },
  { label: "Role", value: "CEO of Lumen Labs" },
  { label: "Occupation", value: "Software engineer and founder" },
  { label: "Notable projects", value: "Lumen Labs, OpenGrid, WikiMe" },
  { label: "Achievements", value: "Forbes 30 Under 30 (Technology)" },
];

export function HomeExampleArticle() {
  const isMobile = useIsMobile();
  const [howOpen, setHowOpen] = useState(false);

  const screenshotBlock = (
    <Link href={`/a/${EXAMPLE_ARTICLE_SLUG}`} className="home-example-screenshot-link">
      <Image
        src={EXAMPLE_SCREENSHOT.src}
        alt="Screenshot of the WikiMe example article for Maya Chen"
        width={EXAMPLE_SCREENSHOT.width}
        height={EXAMPLE_SCREENSHOT.height}
        className="home-example-screenshot"
        priority
        placeholder="blur"
        blurDataURL={MAYA_SCREENSHOT_BLUR}
        sizes="(max-width: 640px) 100vw, 360px"
      />
      <span className="home-example-screenshot-caption">
        Sample output · Creative mode · Tap to open live article
      </span>
    </Link>
  );

  if (isMobile) {
    return (
      <section className="home-example home-example--mobile" aria-labelledby="home-example-heading">
        <div className="home-example-header">
          <div>
            <p className="home-example-eyebrow">Sample output</p>
            <h2 id="home-example-heading" className="home-example-title">
              See what WikiMe generates
            </h2>
          </div>
          <Link href={`/a/${EXAMPLE_ARTICLE_SLUG}`} className="home-example-cta">
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
            <p className="home-example-desc">
              Upload a LinkedIn profile screenshot. Vision AI extracts facts, then generates a
              full Wikipedia-style biography.
            </p>
            <MayaChenLinkedInMock />
            <ul className="home-example-extracted home-example-extracted--compact">
              {EXTRACTED_FIELDS.slice(0, 4).map((f) => (
                <li key={f.label}>
                  <span className="home-example-extracted-label">{f.label}</span>
                  <span className="home-example-extracted-value">{f.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="home-example" aria-labelledby="home-example-heading">
      <div className="home-example-header">
        <div>
          <p className="home-example-eyebrow">How it works</p>
          <h2 id="home-example-heading" className="home-example-title">
            From screenshot to Wikipedia article
          </h2>
          <p className="home-example-desc">
            Upload a LinkedIn (or similar) profile screenshot. Vision AI extracts facts, then
            generates a full biography — here is Maya Chen, our demo subject.
          </p>
        </div>
        <Link href={`/a/${EXAMPLE_ARTICLE_SLUG}`} className="home-example-cta">
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
            {EXTRACTED_FIELDS.map((f) => (
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
          <p className="home-example-demo-label">3 · Wikipedia-style article</p>
          {screenshotBlock}
        </div>
      </div>
    </section>
  );
}
