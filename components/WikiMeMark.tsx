import Image from "next/image";

export const WIKIME_MARK_SRC = "/wikime-mark.png";

type WikiMeMarkProps = {
  size?: number;
  className?: string;
  /** Prioritize loading in the site header */
  priority?: boolean;
};

export function WikiMeMark({ size = 28, className, priority = false }: WikiMeMarkProps) {
  return (
    <Image
      src={WIKIME_MARK_SRC}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden
      priority={priority}
    />
  );
}
