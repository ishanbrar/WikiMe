/** Split lead for Wikipedia mobile: 1–2 sentences, then infobox, then rest. */
export function splitSummaryLead(summaryLead: string[]): {
  teaser: string[];
  rest: string[];
} {
  if (!summaryLead.length) return { teaser: [], rest: [] };
  if (summaryLead.length > 1) {
    return { teaser: [summaryLead[0]], rest: summaryLead.slice(1) };
  }

  const text = summaryLead[0].trim();
  if (!text) return { teaser: [], rest: [] };

  const sentences = text.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g);
  if (!sentences || sentences.length <= 2) {
    return { teaser: [text], rest: [] };
  }

  const teaserText = sentences
    .slice(0, 2)
    .join("")
    .trim();
  const restText = sentences
    .slice(2)
    .join("")
    .trim();
  return {
    teaser: teaserText ? [teaserText] : [text],
    rest: restText ? [restText] : [],
  };
}
