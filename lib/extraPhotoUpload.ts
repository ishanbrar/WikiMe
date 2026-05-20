import type { SupplementalPhoto } from "@/lib/articleFigures";

export type ExtraPhotoUpload = {
  dataUrl: string;
  /** What the photo shows — guides AI Wikipedia-style captions */
  description: string;
};

export function createEmptyExtraPhoto(dataUrl: string): ExtraPhotoUpload {
  return { dataUrl, description: "" };
}

export function toSupplementalPhotos(uploads: ExtraPhotoUpload[]): SupplementalPhoto[] {
  return uploads.map((p) => ({
    dataUrl: p.dataUrl,
    description: p.description.trim() || undefined,
  }));
}

/** Prompt block listing each supplemental image index and user note. */
export function formatSupplementalPhotosForPrompt(
  photos: SupplementalPhoto[],
): string {
  if (!photos.length) return "";
  return photos
    .map((p, i) => {
      const note = p.description?.trim();
      return note
        ? `imageIndex ${i}: ${note}`
        : `imageIndex ${i}: (no note — infer a neutral caption from article context)`;
    })
    .join("\n");
}
