import { SiteHeaderMenu } from "@/components/SiteHeaderMenu";
import { WikiMeLogo } from "@/components/WikiMeLogo";

export function SiteHeader({ variant = "default" }: { variant?: "default" | "landing" }) {
  return (
    <header
      className={`site-header no-print ${variant === "landing" ? "site-header--landing" : ""}`}
    >
      <div className="site-header-inner">
        <WikiMeLogo variant="header" />
        <nav className="site-header-nav" aria-label="Main">
          <SiteHeaderMenu />
        </nav>
      </div>
    </header>
  );
}
