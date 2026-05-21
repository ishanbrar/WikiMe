"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ModeSelector } from "@/components/ModeSelector";

const VantaCloudsBackground = dynamic(
  () =>
    import("@/components/VantaCloudsBackground").then((m) => m.VantaCloudsBackground),
  { ssr: false },
);
import { HomeExampleArticle } from "@/components/HomeExampleArticle";
import { HomeExampleModeTabs } from "@/components/HomeExampleModeTabs";
import { LandingHowItWorks } from "@/components/LandingHowItWorks";
import {
  EXAMPLE_REALISM_SLUG,
  getExampleArticleSlug,
} from "@/lib/exampleArticle";
import type { ArticleMode } from "@/types/article";

export function LandingPage() {
  const [exampleMode, setExampleMode] = useState<ArticleMode>("realism");

  return (
    <div className="landing min-h-screen">
      <VantaCloudsBackground />
      <div className="landing-content">
      <section className="landing-hero">
        <h1 className="landing-title">Your life, as a Wikipedia article</h1>
        <p className="landing-lead">
          Upload a headshot and social screenshots, answer a short questionnaire, and
          generate a highly realistic (or unrealistic) Wikipedia-style biography.
        </p>
        <div className="landing-hero-actions">
          <Link href="/generate" className="landing-cta-primary">
            Start your article
          </Link>
          <Link href={`/a/${EXAMPLE_REALISM_SLUG}`} className="landing-cta-secondary">
            View example
          </Link>
        </div>
        <HomeExampleModeTabs value={exampleMode} onChange={setExampleMode} />
      </section>

      <HomeExampleArticle mode={exampleMode} />

      <LandingHowItWorks />

      <section className="landing-modes">
        <h2>Choose your mode</h2>
        <ModeSelector
          value={"realism" as ArticleMode}
          onChange={() => {}}
          readOnly
        />
        <div className="landing-mode-actions">
          <Link href="/generate?mode=realism" className="landing-cta-secondary">
            Realism Mode
          </Link>
          <Link href="/generate?mode=creative" className="landing-cta-dark">
            Creative Mode
          </Link>
        </div>
      </section>
      </div>
    </div>
  );
}
