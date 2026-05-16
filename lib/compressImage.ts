/** Client-side image compression for API uploads (keeps requests under body limits). */

export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Target max encoded size in bytes (approximate). */
  maxBytes?: number;
};

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });
}

function scaleDimensions(
  w: number,
  h: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  let width = w;
  let height = h;
  if (width > maxW) {
    height = (height * maxW) / width;
    width = maxW;
  }
  if (height > maxH) {
    width = (width * maxH) / height;
    height = maxH;
  }
  return { w: Math.round(width), h: Math.round(height) };
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

export async function compressDataUrl(
  dataUrl: string,
  options: CompressOptions = {},
): Promise<string> {
  if (typeof window === "undefined") return dataUrl;

  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 1280;
  const maxBytes = options.maxBytes ?? 480_000;
  let quality = options.quality ?? 0.85;

  const img = await loadImage(dataUrl);
  const { w, h } = scaleDimensions(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  let result = canvas.toDataURL("image/jpeg", quality);
  while (dataUrlByteSize(result) > maxBytes && quality > 0.45) {
    quality -= 0.1;
    result = canvas.toDataURL("image/jpeg", quality);
  }

  return result;
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return compressDataUrl(raw, options);
}

/** Headshot for infobox — smaller payload. */
export function compressHeadshot(file: File) {
  return compressImageFile(file, {
    maxWidth: 640,
    maxHeight: 800,
    quality: 0.88,
    maxBytes: 280_000,
  });
}

/** Social screenshots for vision extraction. */
export function compressScreenshot(file: File) {
  return compressImageFile(file, {
    maxWidth: 1280,
    maxHeight: 1600,
    quality: 0.82,
    maxBytes: 450_000,
  });
}
