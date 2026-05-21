"use client";

import { useEffect, useRef } from "react";

type VantaEffect = { destroy: () => void };

export function VantaCloudsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div
      ref={containerRef}
      className="landing-vanta"
      aria-hidden
    />
  );
}
