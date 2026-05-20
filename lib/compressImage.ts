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
  return { w: Math.max(1, Math.round(width)), h: Math.max(1, Math.round(height)) };
}

export function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function renderJpeg(
  img: HTMLImageElement,
  w: number,
  h: number,
  quality: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function compressDataUrl(
  dataUrl: string,
  options: CompressOptions = {},
): Promise<string> {
  if (typeof window === "undefined") return dataUrl;

  let maxWidth = options.maxWidth ?? 1280;
  let maxHeight = options.maxHeight ?? 1280;
  const maxBytes = options.maxBytes ?? 480_000;
  let quality = options.quality ?? 0.85;

  const img = await loadImage(dataUrl);

  for (let pass = 0; pass < 6; pass++) {
    const { w, h } = scaleDimensions(img.width, img.height, maxWidth, maxHeight);
    let q = quality;
    let result = renderJpeg(img, w, h, q);
    while (dataUrlByteSize(result) > maxBytes && q > 0.4) {
      q -= 0.08;
      result = renderJpeg(img, w, h, q);
    }
    if (dataUrlByteSize(result) <= maxBytes) return result;

    maxWidth = Math.round(maxWidth * 0.85);
    maxHeight = Math.round(maxHeight * 0.85);
    quality = Math.max(0.55, quality - 0.05);
  }

  const { w, h } = scaleDimensions(img.width, img.height, 640, 640);
  return renderJpeg(img, w, h, 0.5);
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
    maxBytes: 220_000,
  });
}

/** Social screenshots for vision extraction. */
export function compressScreenshot(file: File) {
  return compressImageFile(file, {
    maxWidth: 1200,
    maxHeight: 1500,
    quality: 0.8,
    maxBytes: 380_000,
  });
}

/** Optional inline article photos. */
export function compressExtraPhoto(file: File) {
  return compressImageFile(file, {
    maxWidth: 1000,
    maxHeight: 1200,
    quality: 0.82,
    maxBytes: 300_000,
  });
}
