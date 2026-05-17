"use client";

import Link from "next/link";
import { useState } from "react";
import { ModeSelector } from "@/components/ModeSelector";
import { HomeExampleArticle } from "@/components/HomeExampleArticle";
import { HomeExampleModeTabs } from "@/components/HomeExampleModeTabs";
import {
  EXAMPLE_REALISM_SLUG,
  getExampleArticleSlug,
} from "@/lib/exampleArticle";
import type { ArticleMode } from "@/types/article";

export function LandingPage() {
  const [exampleMode, setExampleMode] = useState<ArticleMode>("realism");

  return (
    <div className="landing min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="landing-hero">
        <p className="landing-eyebrow">No account required to try</p>
        <h1 className="landing-title">Your life, as a Wikipedia article</h1>
        <p className="landing-lead">
          Upload a headshot and social screenshots, answer a short questionnaire, and
          generate a highly realistic Wikipedia-style biography — grounded or legendary.
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

      <section className="landing-features">
        <div className="landing-feature">
          <h3>Upload & extract</h3>
          <p>
            Vision AI reads your LinkedIn, Instagram, or portfolio screenshots and
            extracts compact facts — keeping token costs low.
          </p>
        </div>
        <div className="landing-feature">
          <h3>Wikipedia layout</h3>
          <p>
            Infobox, table of contents, references, and encyclopedic typography —
            inspired by Wikipedia, not impersonating it.
          </p>
        </div>
        <div className="landing-feature">
          <h3>Save & share</h3>
          <p>
            Every article gets a unique link. Sign up to save articles to your account
            and revisit them anytime.
          </p>
        </div>
      </section>

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
  );
}
