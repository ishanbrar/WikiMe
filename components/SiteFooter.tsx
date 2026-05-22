import Link from "next/link";
import { WikiMeLogo } from "@/components/WikiMeLogo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer no-print">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-col site-footer-brand-col">
            <WikiMeLogo variant="footer" />
            <p className="site-footer-tagline">
              Turn your profile into a Wikipedia-style biography.
            </p>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">Product</h3>
            <ul className="site-footer-links">
              <li>
                <Link href="/generate">Create article</Link>
              </li>
              <li>
                <Link href="/a/maya-chen-realism">Example article</Link>
              </li>
              <li>
                <Link href="/account">My articles</Link>
              </li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">Account</h3>
            <ul className="site-footer-links">
              <li>
                <Link href="/signup">Sign up</Link>
              </li>
              <li>
                <Link href="/generate?mode=creative">Creative mode</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © {year} WikiMe · Created by{" "}
            <span className="site-footer-author">Ishan Brar</span>
          </p>
          <p className="site-footer-disclaimer">
            Not affiliated with the Wikimedia Foundation.
          </p>
        </div>
      </div>
    </footer>
  );
}
