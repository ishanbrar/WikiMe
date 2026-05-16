"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { UploadPreview } from "@/components/UploadPreview";
import { HeadshotInfoboxPreview } from "@/components/HeadshotInfoboxPreview";
import { readFileAsDataUrl } from "@/lib/cropHeadshot";

const HeadshotCropModal = dynamic(
  () => import("@/components/HeadshotCropModal").then((m) => m.HeadshotCropModal),
  { ssr: false },
);

export function HeadshotUploader({
  label,
  image,
  subjectName,
  onChange,
  disabled,
}: {
  label: string;
  image: string;
  subjectName?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingSource, setPendingSource] = useState<string | null>(null);

  const handleFile = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const file = files[0];
    if (!file?.type.startsWith("image/")) return;
    try {
      const raw = await readFileAsDataUrl(file);
      setPendingSource(raw);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <p className="text-xs text-slate-500 mb-2">
        Portrait crop (4:5) sized for the infobox — drag and zoom after you choose a photo.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          void handleFile(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {image ? "Replace headshot" : "Choose headshot"}
      </button>
      {image ? (
        <div className="mt-4 flex flex-wrap gap-4 items-start">
          <HeadshotInfoboxPreview imageUrl={image} name={subjectName || "You"} />
          <div className="flex flex-wrap gap-2 items-start">
            <UploadPreview
              src={image}
              label="Headshot"
              onRemove={disabled ? undefined : () => onChange("")}
            />
            <button
              type="button"
              className="text-sm text-blue-600 mt-6"
              disabled={disabled}
              onClick={() => setPendingSource(image)}
            >
              Re-crop
            </button>
          </div>
        </div>
      ) : null}

      {pendingSource ? (
        <HeadshotCropModal
          source={pendingSource}
          onCancel={() => setPendingSource(null)}
          onConfirm={(cropped) => {
            onChange(cropped);
            setPendingSource(null);
          }}
        />
      ) : null}
    </div>
  );
}
