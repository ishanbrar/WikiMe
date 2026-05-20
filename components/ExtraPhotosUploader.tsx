"use client";

import { useRef } from "react";
import { compressExtraPhoto } from "@/lib/compressImage";
import {
  createEmptyExtraPhoto,
  type ExtraPhotoUpload,
} from "@/lib/extraPhotoUpload";

const MAX_PHOTOS = 2;

export function ExtraPhotosUploader({
  photos,
  onChange,
  disabled,
}: {
  photos: ExtraPhotoUpload[];
  onChange: (photos: ExtraPhotoUpload[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await compressExtraPhoto(file);
        next.push(createEmptyExtraPhoto(url));
      } catch {
        /* ignore */
      }
    }
    onChange(next.slice(0, MAX_PHOTOS));
  };

  const updateDescription = (index: number, description: string) => {
    onChange(
      photos.map((p, i) => (i === index ? { ...p, description } : p)),
    );
  };

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Additional photos (optional)
      </label>
      <p className="text-xs text-slate-500 mb-3">
        Up to {MAX_PHOTOS} extra images in the article. Add a short note for each
        photo so captions match what is pictured (graduation, team photo, etc.).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || photos.length >= MAX_PHOTOS}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn-secondary text-sm"
        disabled={disabled || photos.length >= MAX_PHOTOS}
        onClick={() => inputRef.current?.click()}
      >
        {photos.length >= MAX_PHOTOS
          ? "Maximum photos added"
          : `Add photo (${photos.length}/${MAX_PHOTOS})`}
      </button>
      {photos.length > 0 && (
        <ul className="extra-photos-grid mt-4">
          {photos.map((photo, i) => (
            <li key={i} className="extra-photos-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt="" className="extra-photos-thumb" />
              <label className="extra-photos-caption-label">
                <span className="text-xs font-medium text-slate-600">
                  What is this photo about?
                </span>
                <textarea
                  className="extra-photos-caption-input"
                  rows={2}
                  maxLength={400}
                  placeholder="e.g. Graduation from Plano West, 2022"
                  value={photo.description}
                  disabled={disabled}
                  onChange={(e) => updateDescription(i, e.target.value)}
                />
              </label>
              <button
                type="button"
                className="extra-photos-remove text-xs text-red-600"
                disabled={disabled}
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
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
