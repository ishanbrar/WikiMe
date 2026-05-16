"use client";

import type { AppearanceSettings } from "@/types/article";

export function AppearancePanel({
  settings,
  hidden,
  onSettingsChange,
  onToggle,
}: {
  settings: AppearanceSettings;
  hidden: boolean;
  onSettingsChange: (s: AppearanceSettings) => void;
  onToggle: () => void;
}) {
  if (hidden) {
    return (
      <div className="wiki-appearance">
        <button type="button" className="wiki-contents-toggle" onClick={onToggle}>
          show
        </button>
      </div>
    );
  }

  const set = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) => onSettingsChange({ ...settings, [key]: value });

  return (
    <div className="wiki-appearance">
      <div className="wiki-contents-header">
        <span className="font-bold text-sm">Appearance</span>
        <button type="button" className="wiki-contents-toggle" onClick={onToggle}>
          hide
        </button>
      </div>
      <div className="wiki-appearance-group">
        <label className="wiki-appearance-label">Text</label>
        <div className="flex gap-1 flex-wrap">
          {(["small", "standard", "large"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`wiki-appearance-btn ${settings.textSize === v ? "active" : ""}`}
              onClick={() => set("textSize", v)}
            >
              {v === "small" ? "Small" : v === "large" ? "Large" : "Standard"}
            </button>
          ))}
        </div>
      </div>
      <div className="wiki-appearance-group">
        <label className="wiki-appearance-label">Width</label>
        <div className="flex gap-1 flex-wrap">
          {(["standard", "wide"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`wiki-appearance-btn ${settings.width === v ? "active" : ""}`}
              onClick={() => set("width", v)}
            >
              {v === "wide" ? "Wide" : "Standard"}
            </button>
          ))}
        </div>
      </div>
      <div className="wiki-appearance-group">
        <label className="wiki-appearance-label">Color</label>
        <div className="flex gap-1 flex-wrap">
          {(["auto", "light", "dark"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`wiki-appearance-btn ${settings.color === v ? "active" : ""}`}
              onClick={() => set("color", v)}
            >
              {v === "auto" ? "Automatic" : v === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
