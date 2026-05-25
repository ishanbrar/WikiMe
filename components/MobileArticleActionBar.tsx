"use client";

import { PencilIcon, ShareIcon } from "@/components/icons/ArticleToolbarIcons";

export function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MobileArticleActionBar({
  editing,
  busy,
  onToggleEdit,
  onCopyLink,
  onShare,
  showEditAction = true,
  showCopyAction = true,
}: {
  editing: boolean;
  busy: boolean;
  onToggleEdit: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  showEditAction?: boolean;
  showCopyAction?: boolean;
}) {
  return (
    <div className="mobile-article-action-bar no-print" aria-label="Article actions">
      {showEditAction && (
        <button
          type="button"
          className="mobile-article-action"
          onClick={onToggleEdit}
          disabled={busy}
        >
          <PencilIcon />
          <span>{editing ? "Preview" : "Edit"}</span>
        </button>
      )}
      {showCopyAction && (
        <button
          type="button"
          className="mobile-article-action"
          onClick={onCopyLink}
          disabled={busy}
        >
          <CopyIcon />
          <span>Copy</span>
        </button>
      )}
      <button
        type="button"
        className="mobile-article-action mobile-article-action--primary"
        onClick={onShare}
        disabled={busy}
      >
        <ShareIcon />
        <span>Share</span>
      </button>
    </div>
  );
}
