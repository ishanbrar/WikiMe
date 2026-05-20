import { compressDataUrl } from "@/lib/compressImage";
import { UPLOAD_LIMITS } from "@/lib/prepareUploadImages";
import { HEADSHOT_OUTPUT } from "@/lib/headshotForArticle";

export type HeadshotCropState = {
  /** Multiplier on top of “cover” scale (1 = fill frame). */
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Scale so image fully covers the crop frame. */
export function coverScale(
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
): number {
  return Math.max(frameW / imgW, frameH / imgH);
}

export function initialCropState(
  img: HTMLImageElement,
  frameW: number,
  frameH: number,
): HeadshotCropState {
  return {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export async function exportHeadshotCrop(
  img: HTMLImageElement,
  frameW: number,
  frameH: number,
  state: HeadshotCropState,
): Promise<string> {
  const base = coverScale(img.width, img.height, frameW, frameH);
  const total = base * state.scale;
  const displayW = img.width * total;
  const displayH = img.height * total;

  const centerX = frameW / 2 + state.offsetX;
  const centerY = frameH / 2 + state.offsetY;
  const imgLeft = centerX - displayW / 2;
  const imgTop = centerY - displayH / 2;

  const sx = clamp((-imgLeft) / total, 0, img.width);
  const sy = clamp((-imgTop) / total, 0, img.height);
  const sw = clamp(frameW / total, 1, img.width - sx);
  const sh = clamp(frameH / total, 1, img.height - sy);

  const canvas = document.createElement("canvas");
  canvas.width = HEADSHOT_OUTPUT.width;
  canvas.height = HEADSHOT_OUTPUT.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const cropped = canvas.toDataURL("image/jpeg", 0.9);
  return compressDataUrl(cropped, UPLOAD_LIMITS.headshot);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Drag limits so the frame stays filled. */
export function clampCropOffset(
  img: HTMLImageElement,
  frameW: number,
  frameH: number,
  state: HeadshotCropState,
  nextX: number,
  nextY: number,
): { offsetX: number; offsetY: number } {
  const base = coverScale(img.width, img.height, frameW, frameH);
  const total = base * state.scale;
  const displayW = img.width * total;
  const displayH = img.height * total;
  const maxX = Math.max(0, (displayW - frameW) / 2);
  const maxY = Math.max(0, (displayH - frameH) / 2);
  return {
    offsetX: clamp(nextX, -maxX, maxX),
    offsetY: clamp(nextY, -maxY, maxY),
  };
}
