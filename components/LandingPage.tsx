"use client";

import Link from "next/link";
import { ModeSelector } from "@/components/ModeSelector";
import type { ArticleMode } from "@/types/article";

export function LandingPage() {
  return (
    <div className="landing min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-xl font-bold text-slate-900">WikiMe</span>
        <Link href="/generate" className="text-sm text-blue-600 hover:underline">
          My articles
        </Link>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Your life, as a Wikipedia article
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Upload a headshot and social screenshots, answer a short questionnaire, and
          generate a highly realistic Wikipedia-style biography — grounded or legendary.
        </p>
        <Link
          href="/generate"
          className="inline-block mt-8 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Start your article
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="font-semibold text-slate-900">Upload & extract</h3>
          <p className="mt-2 text-sm text-slate-600">
            Vision AI reads your LinkedIn, Instagram, or portfolio screenshots and
            extracts compact facts — keeping token costs low.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="font-semibold text-slate-900">Wikipedia layout</h3>
          <p className="mt-2 text-sm text-slate-600">
            Infobox, table of contents, references, and encyclopedic typography —
            inspired by Wikipedia, not impersonating it.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="font-semibold text-slate-900">Edit & share</h3>
          <p className="mt-2 text-sm text-slate-600">
            No account required. Save locally, share a link, export PDF or PNG, and
            revisit anytime.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">
          Choose your mode
        </h2>
        <ModeSelector
          value={"realism" as ArticleMode}
          onChange={() => {}}
          readOnly
        />
        <div className="text-center mt-8">
          <Link
            href="/generate?mode=realism"
            className="inline-block px-6 py-2.5 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 mr-3"
          >
            Realism Mode
          </Link>
          <Link
            href="/generate?mode=creative"
            className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Creative Mode
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 pb-8">
        WikiMe is not affiliated with Wikipedia or the Wikimedia Foundation.
      </footer>
    </div>
  );
}
