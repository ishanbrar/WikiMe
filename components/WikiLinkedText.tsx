"use client";

import { useMemo } from "react";
import { getCachedWikiSegments } from "@/lib/wikiLinkCache";
import { wikiUrl } from "@/lib/wikipediaLinks";

export function WikiLinkedText({
  text,
  properNouns,
  subjectName,
  maxLinksPerTerm,
}: {
  text: string;
  properNouns: string[];
  subjectName: string;
  maxLinksPerTerm?: number;
}) {
  const parts = useMemo(
    () =>
      getCachedWikiSegments(text, properNouns, subjectName, {
        maxPerTerm: maxLinksPerTerm,
      }),
    [text, properNouns, subjectName, maxLinksPerTerm],
  );

  return (
    <>
      {parts.map((part, i) =>
        part.type === "link" ? (
          <a
            key={i}
            href={wikiUrl(part.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="wiki-link"
            title={`Wikipedia: ${part.title}`}
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </>
  );
}
