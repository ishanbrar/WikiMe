"use client";

import { useId } from "react";
import { WIKIME_CREATIVE_BLUE, WIKIME_CREATIVE_BLUE_LIGHT } from "@/lib/brandColors";

/** Bold “W” mark — same shape as app/icon.svg */
export const WIKIME_W_PATH =
  "M3 7.5 9.8 25.5 16 11.2 22.2 25.5 29 7.5H24.2L20.1 21.8 16 11.2 11.9 21.8 7.8 7.5H3z";

type WikiMeMarkProps = {
  size?: number;
  className?: string;
  /** Subtle glow like creative-mode fields (navbar); off for tiny favicons */
  glow?: boolean;
};

export function WikiMeMark({ size = 28, className, glow = true }: WikiMeMarkProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `wikime-w-grad-${uid}`;
  const glowId = `wikime-w-glow-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      {glow && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={WIKIME_CREATIVE_BLUE_LIGHT} />
            <stop offset="100%" stopColor={WIKIME_CREATIVE_BLUE} />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <path
        d={WIKIME_W_PATH}
        fill={glow ? `url(#${gradId})` : WIKIME_CREATIVE_BLUE}
        filter={glow ? `url(#${glowId})` : undefined}
      />
    </svg>
  );
}
