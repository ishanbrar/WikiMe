"use client";

import type { ExtractedProfileFacts, IntakeData } from "@/types/article";
import type { IntakeSmartParse } from "@/lib/smartParseIntake";
import { extractUrlsFromText } from "@/lib/sourceUrlScan";

type LinkStatus = {
  url: string;
  finalUrl?: string;
  status: "fetched" | "blocked" | "pdf" | "login-required" | "timed-out" | "failed";
  title?: string;
  detail?: string;
};

function nonempty(...items: Array<string | undefined | null>): string[] {
  return items.map((s) => s?.trim()).filter((s): s is string => Boolean(s));
}

function statusLabel(status: LinkStatus["status"]): string {
  switch (status) {
    case "fetched":
      return "Fetched";
    case "pdf":
      return "PDF recorded";
    case "blocked":
      return "Blocked";
    case "login-required":
      return "Login required";
    case "timed-out":
      return "Timed out";
    default:
      return "Failed";
  }
}

export function SourcePreview({
  intake,
  parsed,
  facts,
  linkStatuses,
  linkBusy,
  onAnalyzeSources,
  onApplyParsed,
}: {
  intake: IntakeData;
  parsed: IntakeSmartParse;
  facts?: ExtractedProfileFacts | null;
  linkStatuses: LinkStatus[];
  linkBusy: boolean;
  onAnalyzeSources: () => void;
  onApplyParsed: () => void;
}) {
  const text = [
    intake.extraNotes,
    intake.pastedProfileText,
    intake.achievements,
    intake.lifeEvents,
    intake.controversies,
  ].join("\n");
  const urls = extractUrlsFromText(text);
  const found = {
    name: nonempty(intake.fullName, parsed.fullName),
    education: nonempty(intake.education, parsed.education, ...(facts?.education ?? [])),
    publications: nonempty(
      parsed.achievements,
      ...(facts?.notableClaims.filter((c) => /publication|journal|source/i.test(c)) ?? []),
    ),
    controversies: nonempty(intake.controversies, parsed.controversies),
    personal: nonempty(intake.lifeEvents, parsed.lifeEvents),
    links: urls,
  };
  const hasParsedSuggestions = Object.entries(parsed).some(
    ([key, value]) =>
      typeof value === "string" &&
      value.trim() &&
      !String(intake[key as keyof IntakeData] ?? "").trim(),
  );

  return (
    <div className="source-preview">
      <div className="source-preview-head">
        <div>
          <h3 className="source-preview-title">WikiMe found</h3>
          <p className="source-preview-sub">
            Review what will be used before generation.
          </p>
        </div>
        <div className="source-preview-actions">
          {hasParsedSuggestions && (
            <button type="button" className="btn-secondary text-xs" onClick={onApplyParsed}>
              Fill fields
            </button>
          )}
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={linkBusy || urls.length === 0}
            onClick={onAnalyzeSources}
          >
            {linkBusy ? "Reading links…" : urls.length ? "Read links" : "No links"}
          </button>
        </div>
      </div>
      <div className="source-preview-grid">
        {Object.entries(found).map(([key, values]) => (
          <div key={key} className="source-preview-row">
            <span className="source-preview-label">{key}</span>
            <span className="source-preview-value">
              {values.length ? values.slice(0, 2).join("; ") : "Not found yet"}
            </span>
          </div>
        ))}
      </div>
      {linkStatuses.length > 0 && (
        <div className="source-link-chips">
          {linkStatuses.map((item) => (
            <span
              key={item.url}
              className={`source-link-chip source-link-chip--${item.status}`}
              title={item.detail || item.finalUrl || item.url}
            >
              {statusLabel(item.status)}
              {item.title ? `: ${item.title}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
