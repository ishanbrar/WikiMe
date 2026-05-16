"use client";

import { segmentWikiLinks, wikiUrl } from "@/lib/wikipediaLinks";

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
  const parts = segmentWikiLinks(text, properNouns, subjectName, {
    maxPerTerm: maxLinksPerTerm,
  });

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
