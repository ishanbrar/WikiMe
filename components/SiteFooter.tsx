import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="site-footer-inner">
        <p className="site-footer-brand">
          <Link href="/">WikiMe</Link>
        </p>
        <p className="site-footer-credit">
          Created by{" "}
          <span className="site-footer-author">Ishan Brar</span>
        </p>
        <p className="site-footer-note">
          Wikipedia-inspired layout only — not affiliated with the Wikimedia Foundation.
        </p>
      </div>
    </footer>
  );
}
