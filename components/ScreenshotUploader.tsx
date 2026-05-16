"use client";

import { useRef } from "react";
import { UploadPreview } from "@/components/UploadPreview";
import { compressHeadshot, compressScreenshot } from "@/lib/compressImage";

export function ScreenshotUploader({
  label,
  multiple,
  images,
  onChange,
  accept = "image/*",
  variant = "screenshot",
}: {
  label: string;
  multiple?: boolean;
  images: string[];
  onChange: (images: string[]) => void;
  accept?: string;
  /** headshot = smaller compress for infobox only */
  variant?: "headshot" | "screenshot";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls: string[] = [];
    const compress = variant === "headshot" ? compressHeadshot : compressScreenshot;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        urls.push(await compress(f));
      } catch {
        onChange(images);
        return;
      }
    }
    onChange(multiple ? [...images, ...urls].slice(0, 6) : urls.slice(0, 1));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn-secondary"
        onClick={() => inputRef.current?.click()}
      >
        Choose {multiple ? "images" : "image"}
      </button>
      <div className="flex flex-wrap gap-2 mt-3">
        {images.map((src, i) => (
          <UploadPreview
            key={i}
            src={src}
            label={`${label} ${i + 1}`}
            onRemove={() => onChange(images.filter((_, j) => j !== i))}
          />
        ))}
      </div>
    </div>
  );
}
