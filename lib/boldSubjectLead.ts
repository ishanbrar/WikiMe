/** Split text so the first occurrence of the subject name can render bold (Wikipedia lead). */
export function splitSubjectNameBold(
  text: string,
  subjectName: string,
  articleTitle?: string,
): { before: string; name: string; after: string } | null {
  const candidates = [subjectName.trim(), articleTitle?.trim() ?? ""].filter(
    (n) => n.length > 0,
  );
  for (const name of candidates) {
    const idx = text.indexOf(name);
    if (idx !== -1) {
      return {
        before: text.slice(0, idx),
        name,
        after: text.slice(idx + name.length),
      };
    }
  }
  return null;
}
