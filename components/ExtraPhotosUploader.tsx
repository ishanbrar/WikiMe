"use client";

import { useRef } from "react";
import { readFileAsDataUrl } from "@/lib/cropHeadshot";

const MAX_PHOTOS = 2;

export function ExtraPhotosUploader({
  images,
  onChange,
  disabled,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await readFileAsDataUrl(file);
        next.push(url);
      } catch {
        /* ignore */
      }
    }
    onChange(next.slice(0, MAX_PHOTOS));
  };

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Additional photos (optional)
      </label>
      <p className="text-xs text-slate-500 mb-3">
        Up to {MAX_PHOTOS} extra images placed in the article with Wikipedia-style
        captions (career, personal life, etc.).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || images.length >= MAX_PHOTOS}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn-secondary text-sm"
        disabled={disabled || images.length >= MAX_PHOTOS}
        onClick={() => inputRef.current?.click()}
      >
        {images.length >= MAX_PHOTOS
          ? "Maximum photos added"
          : `Add photo (${images.length}/${MAX_PHOTOS})`}
      </button>
      {images.length > 0 && (
        <ul className="extra-photos-grid mt-4">
          {images.map((src, i) => (
            <li key={i} className="extra-photos-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="extra-photos-thumb" />
              <button
                type="button"
                className="extra-photos-remove text-xs text-red-600"
                disabled={disabled}
                onClick={() => onChange(images.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
