/** Wikipedia biographies do not use rhetorical or direct questions in body prose. */

function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g) ?? [trimmed];
}

function isQuestionLikeSentence(sentence: string): boolean {
  const s = sentence.trim();
  if (!s) return false;
  if (s.endsWith("?")) return true;
  if (/^The question\b/i.test(s)) return true;
  if (/\bthe question (?:that|whether|of|remains)\b/i.test(s)) return true;
  if (/\b(?:remains|left) (?:unclear|unanswered) whether\b/i.test(s)) return true;
  if (
    /^(?:Is|Are|Was|Were|Does|Do|Did|Can|Could|Should|Would|How|Why|What|Where|When|Who)\b/i.test(
      s,
    ) &&
    /\?/.test(s)
  ) {
    return true;
  }
  return false;
}

export function stripQuestionsFromProse(text: string): string {
  const sentences = splitSentences(text);
  if (!sentences.length) return text.trim();
  const kept = sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isQuestionLikeSentence(s));
  return kept.join(" ").replace(/\s+/g, " ").trim();
}
