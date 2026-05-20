"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampCropOffset,
  exportHeadshotCrop,
  initialCropState,
  loadImageElement,
  type HeadshotCropState,
} from "@/lib/cropHeadshot";
import { HEADSHOT_CROP_ASPECT } from "@/lib/headshotForArticle";

const FRAME_W = 264;
const FRAME_H = Math.round(FRAME_W / HEADSHOT_CROP_ASPECT);

export function HeadshotCropModal({
  source,
  onConfirm,
  onCancel,
}: {
  source: string;
  onConfirm: (cropped: string) => void;
  onCancel: () => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [state, setState] = useState<HeadshotCropState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadImageElement(source).then((el) => {
      if (!cancelled) {
        setImg(el);
        setState(initialCropState(el, FRAME_W, FRAME_H));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: state.offsetX,
      oy: state.offsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !img) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const next = clampCropOffset(
      img,
      FRAME_W,
      FRAME_H,
      state,
      dragRef.current.ox + dx,
      dragRef.current.oy + dy,
    );
    setState((s) => ({ ...s, ...next }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const apply = useCallback(async () => {
    if (!img) return;
    setBusy(true);
    try {
      const cropped = await exportHeadshotCrop(img, FRAME_W, FRAME_H, state);
      onConfirm(cropped);
    } finally {
      setBusy(false);
    }
  }, [img, state, onConfirm]);

  const displayScale = img
    ? Math.max(FRAME_W / img.width, FRAME_H / img.height) * state.scale
    : 1;

  return (
    <div className="headshot-crop-overlay" role="dialog" aria-modal aria-labelledby="headshot-crop-title">
      <div className="headshot-crop-panel">
        <h2 id="headshot-crop-title" className="headshot-crop-title">
          Crop headshot for infobox
        </h2>
        <p className="headshot-crop-hint">
          Drag to reposition. Use zoom to fit your face — this matches the Wikipedia infobox portrait
          size.
        </p>
        <div
          className="headshot-crop-frame"
          style={{ width: FRAME_W, height: FRAME_H }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source}
              alt=""
              draggable={false}
              className="headshot-crop-image"
              style={{
                width: img.width * displayScale,
                height: img.height * displayScale,
                transform: `translate(calc(-50% + ${state.offsetX}px), calc(-50% + ${state.offsetY}px))`,
              }}
            />
          ) : (
            <span className="text-slate-500 text-sm">Loading…</span>
          )}
        </div>
        <label className="headshot-crop-zoom">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.02}
            value={state.scale}
            disabled={!img}
            onChange={(e) => {
              const scale = Number(e.target.value);
              setState((s) => {
                if (!img) return { ...s, scale };
                const clamped = clampCropOffset(
                  img,
                  FRAME_W,
                  FRAME_H,
                  { ...s, scale },
                  s.offsetX,
                  s.offsetY,
                );
                return { scale, ...clamped };
              });
            }}
          />
        </label>
        <div className="headshot-crop-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void apply()}
            disabled={!img || busy}
          >
            {busy ? "Saving…" : "Use this photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
