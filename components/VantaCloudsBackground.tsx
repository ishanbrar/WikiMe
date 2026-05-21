"use client";

import { useEffect, useRef, useState } from "react";

type VantaEffect = { destroy: () => void };

/** Skip WebGL Vanta on touch-first / narrow layouts and when users prefer less motion. */
const SKIP_VANTA_MQ = "(prefers-reduced-motion: reduce), (pointer: coarse), (max-width: 768px)";

function readSkipVanta(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(SKIP_VANTA_MQ).matches;
}

export function VantaCloudsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [skipVanta, setSkipVanta] = useState(readSkipVanta);

  useEffect(() => {
    const mq = window.matchMedia(SKIP_VANTA_MQ);
    const sync = () => setSkipVanta(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (skipVanta) return;

    const el = containerRef.current;
    if (!el) return;

    let effect: VantaEffect | null = null;
    let cancelled = false;

    void Promise.all([
      import("vanta/dist/vanta.clouds.min"),
      import("three"),
    ]).then(([CLOUDS, THREE]) => {
      if (cancelled || !containerRef.current) return;
      const clouds = CLOUDS.default ?? CLOUDS;
      effect = clouds({
        el: containerRef.current,
        THREE,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
      }) as VantaEffect;
    });

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, [skipVanta]);

  return (
    <div
      ref={containerRef}
      className={skipVanta ? "landing-vanta landing-vanta--static" : "landing-vanta"}
      aria-hidden
    />
  );
}
