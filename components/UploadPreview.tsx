"use client";

export function UploadPreview({
  src,
  label,
  onRemove,
}: {
  src: string;
  label: string;
  onRemove?: () => void;
}) {
  return (
    <div className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="h-24 w-24 object-cover rounded border border-slate-200"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
