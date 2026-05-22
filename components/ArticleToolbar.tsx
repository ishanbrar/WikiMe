"use client";

import { useEffect, useRef, useState } from "react";
import { ExportControls } from "@/components/ExportControls";
import { IconButton } from "@/components/IconButton";
import {
  EyeIcon,
  MoreIcon,
  PencilIcon,
  SaveIcon,
} from "@/components/icons/ArticleToolbarIcons";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { ArticleJson, IntakeData, SavedArticle } from "@/types/article";

export function ArticleToolbar({
  editing,
  onToggleEdit,
  showHeadshot,
  onToggleHeadshot,
  showIntake,
  onToggleIntake,
  busy,
  onRegenerateAll,
  intakeMode,
  onModeChange,
  onSaveLocal,
  article,
  saved,
  onSaveToServer,
  onSaveArticle,
  canSaveToServer,
  saveMessage,
}: {
  editing: boolean;
  onToggleEdit: () => void;
  showHeadshot: boolean;
  onToggleHeadshot: () => void;
  showIntake: boolean;
  onToggleIntake: () => void;
  busy: boolean;
  onRegenerateAll: () => void;
  intakeMode: IntakeData["mode"];
  onModeChange: (mode: IntakeData["mode"]) => void;
  onSaveLocal: () => void;
  article: ArticleJson;
  saved: SavedArticle;
  onSaveToServer: () => Promise<string | null>;
  onSaveArticle: () => Promise<void>;
  canSaveToServer: boolean;
  saveMessage?: string;
}) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;
    const close = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [optionsOpen]);

  const modeSelect = (
    <select
      className="text-sm border rounded px-2 py-1 disabled:opacity-50 w-full"
      value={intakeMode}
      disabled={busy}
      onChange={(e) => onModeChange(e.target.value as IntakeData["mode"])}
    >
      <option value="realism">Realism</option>
      <option value="creative">Creative</option>
    </select>
  );

  return (
    <div
      className={`article-toolbar-bar no-print sticky top-0 z-50 bg-white/95 border-b border-slate-200 ${busy ? "opacity-60" : ""}`}
    >
      <div className="article-toolbar-bar-inner">
        <IconButton
          label={editing ? "Preview article" : "Edit article"}
          onClick={onToggleEdit}
          disabled={busy}
        >
          {editing ? <EyeIcon /> : <PencilIcon />}
        </IconButton>

        <div className="article-toolbar-actions" ref={optionsRef}>
          <IconButton
            label="More options"
            aria-expanded={optionsOpen}
            aria-haspopup="menu"
            onClick={() => setOptionsOpen((v) => !v)}
            disabled={busy}
          >
            <MoreIcon />
          </IconButton>
          {optionsOpen && (
            <div className="article-toolbar-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleHeadshot();
                  setOptionsOpen(false);
                }}
                disabled={busy}
              >
                {showHeadshot ? "Hide headshot" : "Headshot"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleIntake();
                  setOptionsOpen(false);
                }}
                disabled={busy}
              >
                {showIntake ? "Hide intake" : "Intake"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onRegenerateAll();
                  setOptionsOpen(false);
                }}
                disabled={busy}
              >
                Regenerate all
              </button>
              <div className="article-toolbar-menu-mode" role="none">
                <label className="text-xs text-slate-500">Mode</label>
                {modeSelect}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSaveLocal();
                  setOptionsOpen(false);
                }}
                disabled={busy}
              >
                Save locally
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-btn icon-btn--primary"
          aria-label={busy ? "Saving article" : "Save article"}
          title="Save article text, headshot, and links to your share link"
          disabled={busy || !canSaveToServer}
          aria-busy={busy}
          onClick={() => void onSaveArticle()}
        >
          {busy ? <LoadingSpinner /> : <SaveIcon />}
        </button>

        <ExportControls
          article={article}
          saved={saved}
          printTargetId="wiki-article-print"
          onSave={onSaveToServer}
          disabled={busy}
          inline
          iconOnly
        />
      </div>
      {saveMessage && (
        <p className="article-toolbar-save-msg" role="status">
          {saveMessage}
        </p>
      )}
    </div>
  );
}
