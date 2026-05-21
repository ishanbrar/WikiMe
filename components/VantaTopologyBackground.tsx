"use client";

import { useEffect, useRef } from "react";

type VantaEffect = { destroy: () => void; resize?: () => void };

const TOPOLOGY_OPTIONS = {
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200,
  minWidth: 200,
  scale: 1,
  scaleMobile: 1,
  color: 0xc8c8be,
  backgroundColor: 0xf7f7f7,
} as const;

export function VantaTopologyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaEffect | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    void Promise.all([
      import("vanta/dist/vanta.topology.min"),
      import("p5"),
    ]).then(([TOPOLOGY, p5Module]) => {
      if (cancelled || !containerRef.current) return;

      const topology = TOPOLOGY.default ?? TOPOLOGY;
      const p5 = p5Module.default;

      effectRef.current = topology({
        el: containerRef.current,
        p5,
        ...TOPOLOGY_OPTIONS,
      }) as VantaEffect;

      effectRef.current.resize?.();
    });

    const onResize = () => effectRef.current?.resize?.();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="landing-vanta" aria-hidden />;
}
