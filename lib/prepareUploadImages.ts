import {
  compressDataUrl,
  dataUrlByteSize,
  type CompressOptions,
} from "@/lib/compressImage";
import type { ExtraPhotoUpload } from "@/lib/extraPhotoUpload";

/** Per-image targets so combined JSON stays under typical serverless body limits. */
export const UPLOAD_LIMITS = {
  headshot: {
    maxWidth: 640,
    maxHeight: 800,
    quality: 0.88,
    maxBytes: 220_000,
  },
  screenshot: {
    maxWidth: 1200,
    maxHeight: 1500,
    quality: 0.8,
    maxBytes: 380_000,
  },
  extra: {
    maxWidth: 1000,
    maxHeight: 1200,
    quality: 0.82,
    maxBytes: 300_000,
  },
} satisfies Record<string, CompressOptions>;

const AGGRESSIVE_LIMITS = {
  headshot: { maxWidth: 480, maxHeight: 600, quality: 0.75, maxBytes: 160_000 },
  screenshot: { maxWidth: 960, maxHeight: 1200, quality: 0.72, maxBytes: 280_000 },
  extra: { maxWidth: 800, maxHeight: 1000, quality: 0.72, maxBytes: 240_000 },
} satisfies Record<string, CompressOptions>;

export type PreparedUploadImages = {
  headshot?: string;
  screenshots: string[];
  extraPhotos: ExtraPhotoUpload[];
};

export async function prepareUploadImages(
  input: {
    headshot?: string;
    screenshots?: string[];
    extraPhotos?: ExtraPhotoUpload[];
  },
  aggressive = false,
): Promise<PreparedUploadImages> {
  const limits = aggressive ? AGGRESSIVE_LIMITS : UPLOAD_LIMITS;

  const [headshot, screenshots, extraPhotos] = await Promise.all([
    input.headshot?.trim()
      ? compressDataUrl(input.headshot, limits.headshot)
      : Promise.resolve(undefined),
    Promise.all(
      (input.screenshots ?? []).map((s) =>
        compressDataUrl(s, limits.screenshot),
      ),
    ),
    Promise.all(
      (input.extraPhotos ?? []).map(async (photo) => ({
        dataUrl: await compressDataUrl(photo.dataUrl, limits.extra),
        description: photo.description ?? "",
        targetSection: photo.targetSection,
        caption: photo.caption,
      })),
    ),
  ]);

  return { headshot, screenshots, extraPhotos };
}

export function totalImagePayloadBytes(images: PreparedUploadImages): number {
  let n = 0;
  if (images.headshot) n += dataUrlByteSize(images.headshot);
  for (const s of images.screenshots) n += dataUrlByteSize(s);
  for (const s of images.extraPhotos) n += dataUrlByteSize(s.dataUrl);
  return n;
}
