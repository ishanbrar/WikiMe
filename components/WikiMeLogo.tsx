import Link from "next/link";
import { WikiMeMark } from "@/components/WikiMeMark";

type WikiMeLogoProps = {
  className?: string;
  markClassName?: string;
  /** Header vs footer class hooks */
  variant?: "header" | "footer";
};

export function WikiMeLogo({
  className,
  markClassName,
  variant = "header",
}: WikiMeLogoProps) {
  const base =
    variant === "header" ? "site-header-logo" : "site-footer-logo";

  return (
    <Link href="/" className={`${base} ${className ?? ""}`.trim()}>
      <WikiMeMark size={28} className={markClassName ?? "wikime-logo-mark"} glow />
      <span className="wikime-logo-wordmark">
        Wiki<span className="wikime-logo-accent">Me</span>
      </span>
    </Link>
  );
}
