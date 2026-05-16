import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

export function SiteHeader({ variant = "default" }: { variant?: "default" | "landing" }) {
  return (
    <header
      className={`site-header no-print ${variant === "landing" ? "site-header--landing" : ""}`}
    >
      <div className="site-header-inner">
        <Link href="/" className="site-header-logo">
          Wiki<span className="site-header-logo-accent">Me</span>
        </Link>
        <nav className="site-header-nav" aria-label="Main">
          <Link href="/generate" className="site-header-link">
            Create
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
