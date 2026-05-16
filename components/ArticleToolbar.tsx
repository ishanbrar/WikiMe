"use client";

import { useEffect, useRef, useState } from "react";
import { LoadingButton } from "@/components/LoadingButton";
import { ExportControls } from "@/components/ExportControls";
import type { ArticleJson, IntakeData, SavedArticle } from "@/types/article";

export function ArticleToolbar({
  editing,
  onToggleEdit,
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
}: {
  editing: boolean;
  onToggleEdit: () => void;
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
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const modeSelect = (
    <select
      className="text-sm border rounded px-2 py-1 disabled:opacity-50"
      value={intakeMode}
      disabled={busy}
      onChange={(e) => onModeChange(e.target.value as IntakeData["mode"])}
    >
      <option value="realism">Realism</option>
      <option value="creative">Creative</option>
    </select>
  );

  return (
    <>
      <div
        className={`article-toolbar no-print sticky top-0 z-50 bg-white/95 border-b border-slate-200 px-4 py-2 flex flex-wrap gap-2 items-center ${busy ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          className="btn-secondary text-sm article-toolbar-primary"
          onClick={onToggleEdit}
          disabled={busy}
        >
          {editing ? "Preview" : "Edit"}
        </button>

        <div className="article-toolbar-desktop flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={onToggleIntake}
            disabled={busy}
          >
            Intake
          </button>
          <LoadingButton
            className="btn-secondary text-sm"
            loading={busy}
            loadingLabel="Regenerating…"
            onClick={onRegenerateAll}
            disabled={busy}
          >
            Regenerate all
          </LoadingButton>
          {modeSelect}
          <button type="button" className="btn-secondary text-sm" onClick={onSaveLocal} disabled={busy}>
            Save locally
          </button>
        </div>

        <div className="article-toolbar-more-wrap" ref={menuRef}>
          <button
            type="button"
            className="btn-secondary text-sm article-toolbar-more"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={busy}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="article-toolbar-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { onToggleIntake(); setMenuOpen(false); }} disabled={busy}>
                Intake
              </button>
              <button type="button" role="menuitem" onClick={() => { onRegenerateAll(); setMenuOpen(false); }} disabled={busy}>
                Regenerate all
              </button>
              <div className="article-toolbar-menu-mode" role="none">
                <label className="text-xs text-slate-500">Mode</label>
                {modeSelect}
              </div>
              <button type="button" role="menuitem" onClick={() => { onSaveLocal(); setMenuOpen(false); }} disabled={busy}>
                Save locally
              </button>
            </div>
          )}
        </div>
      </div>

      <ExportControls
        article={article}
        saved={saved}
        printTargetId="wiki-article-print"
        onSave={onSaveToServer}
        disabled={busy}
      />
    </>
  );
}
