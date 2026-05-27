import type { ArticleFigure, ArticleJson, ArticleSection } from "@/types/article";
import type { ParsedFigure } from "@/lib/wikiSections";

export type SupplementalPhoto = {
  dataUrl: string;
  /** User note about what the photo depicts — guides AI caption writing */
  description?: string;
  /** Preferred article section for placement. */
  targetSection?: string;
  /** Final Wikipedia-style caption (from model or fallback) */
  caption?: string;
};

const PLACEMENTS: { sectionId: string; afterParagraph: number }[] = [
  { sectionId: "career", afterParagraph: 0 },
  { sectionId: "education", afterParagraph: 0 },
  { sectionId: "early-life", afterParagraph: 0 },
  { sectionId: "personal-life", afterParagraph: 0 },
  { sectionId: "public-image", afterParagraph: 0 },
  { sectionId: "achievements", afterParagraph: 0 },
  { sectionId: "projects", afterParagraph: 0 },
];

function captionFromDescription(
  description: string | undefined,
  subjectName: string,
  index: number,
): string {
  const note = description?.trim();
  if (!note) return "";
  const who = subjectName.trim() || "The subject";
  const short =
    note.length > 72 ? `${note.slice(0, 69).trim()}…` : note;
  if (/^[A-Z]/.test(short) && short.length <= 72) return short;
  return `${who}, ${short.charAt(0).toLowerCase()}${short.slice(1)}`;
}

function defaultCaption(subjectName: string, index: number): string {
  const who = subjectName.trim() || "The subject";
  const year = new Date().getFullYear() - index;
  return `${who} in ${year}`;
}

function mergeFigureIntoSection(
  section: ArticleSection,
  figure: ArticleFigure,
  afterParagraph: number,
): ArticleSection {
  const figures = [...(section.figures ?? []), figure];
  return { ...section, figures };
}

/** Place supplemental uploads into sections when the model did not. */
export function applySupplementalPhotos(
  article: ArticleJson,
  photos: SupplementalPhoto[],
  subjectName: string,
): ArticleJson {
  if (!photos.length) return article;

  const used = new Set(
    article.sections.flatMap((s) => (s.figures ?? []).map((f) => f.imageUrl)),
  );
  const pending = photos.filter((p) => p.dataUrl && !used.has(p.dataUrl));
  if (!pending.length) return article;

  const sections = [...article.sections];
  let photoIndex = 0;

  const tryPlace = (sectionIndex: number, photo: SupplementalPhoto, index: number) => {
    if (sectionIndex === -1) return false;
    const sec = sections[sectionIndex]!;
    if ((sec.figures ?? []).some((f) => f.imageUrl === photo.dataUrl)) return false;
    const figure: ArticleFigure = {
      imageUrl: photo.dataUrl,
      caption:
        photo.caption?.trim() ||
        captionFromDescription(photo.description, subjectName, index) ||
        defaultCaption(subjectName, index),
    };
    sections[sectionIndex] = mergeFigureIntoSection(sec, figure, 0);
    return true;
  };

  for (let i = 0; i < pending.length; i++) {
    const photo = pending[i]!;
    const preferred = photo.targetSection?.trim();
    if (!preferred) continue;
    const si = sections.findIndex((s) => s.id === preferred);
    if (tryPlace(si, photo, i)) {
      pending.splice(i, 1);
      i--;
    }
  }

  for (const slot of PLACEMENTS) {
    if (photoIndex >= pending.length) break;
    const photo = pending[photoIndex]!;
    const si = sections.findIndex((s) => s.id === slot.sectionId);
    if (si === -1) continue;
    if (tryPlace(si, photo, photoIndex)) photoIndex++;
  }

  while (photoIndex < pending.length) {
    const photo = pending[photoIndex]!;
    const fallbackIndex = sections.findIndex(
      (s) =>
        s.paragraphs.length > 0 &&
        !(s.figures ?? []).some((f) => f.imageUrl === photo.dataUrl),
    );
    if (fallbackIndex === -1) break;
    if (tryPlace(fallbackIndex, photo, photoIndex)) photoIndex++;
    else break;
  }

  return { ...article, sections };
}

export function resolveFigureUrlsFromIndices(
  sections: ArticleSection[],
  photos: SupplementalPhoto[],
  subjectName = "",
): ArticleSection[] {
  return sections.map((sec) => {
    if (!sec.figures?.length) return sec;
    const figures: ArticleFigure[] = (sec.figures as ParsedFigure[])
      .map((f) => {
        if (f.imageUrl?.startsWith("data:") || f.imageUrl?.startsWith("/")) {
          return { imageUrl: f.imageUrl, caption: f.caption };
        }
        const idx = f.imageIndex;
        if (typeof idx === "number" && photos[idx]?.dataUrl) {
          const photo = photos[idx]!;
          const caption =
            f.caption?.trim() ||
            photo.caption?.trim() ||
            captionFromDescription(photo.description, subjectName, idx) ||
            defaultCaption(subjectName, idx);
          return {
            imageUrl: photo.dataUrl,
            caption,
          };
        }
        if (f.imageUrl) return { imageUrl: f.imageUrl, caption: f.caption };
        return null;
      })
      .filter((f): f is ArticleFigure => f !== null && Boolean(f.imageUrl));
    return figures.length ? { ...sec, figures } : { ...sec, figures: undefined };
  });
}
