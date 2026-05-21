"use client";

import { useMemo } from "react";
import { getCachedWikiSegments } from "@/lib/wikiLinkCache";
import { isCustomLinkUrl, resolveLinkHref } from "@/lib/wikipediaLinks";

export function WikiLinkedText({
  text,
  properNouns,
  subjectName,
  maxLinksPerTerm,
  linkTitles,
}: {
  text: string;
  properNouns: string[];
  subjectName: string;
  maxLinksPerTerm?: number;
  linkTitles?: Record<string, string>;
}) {
  const parts = useMemo(
    () =>
      getCachedWikiSegments(text, properNouns, subjectName, {
        maxPerTerm: maxLinksPerTerm,
        linkTitles,
      }),
    [text, properNouns, subjectName, maxLinksPerTerm, linkTitles],
  );

  return (
    <>
      {parts.map((part, i) =>
        part.type === "link" ? (
          <a
            key={i}
            href={resolveLinkHref(part.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="wiki-link"
            title={
              isCustomLinkUrl(part.title)
                ? part.title
                : `Wikipedia: ${part.title}`
            }
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
