import Image from "next/image";
import Link from "next/link";
import { MayaChenLinkedInMock } from "@/components/MayaChenLinkedInMock";
import { EXAMPLE_ARTICLE_SLUG } from "@/lib/exampleArticle";

const EXAMPLE_SCREENSHOT = "/examples/maya-chen-article-screenshot.png";

const EXTRACTED_FIELDS: { label: string; value: string }[] = [
  { label: "Full name", value: "Maya Chen" },
  { label: "Location", value: "San Francisco, California" },
  { label: "Education", value: "Stanford University (B.S. Computer Science)" },
  { label: "Role", value: "CEO of Lumen Labs" },
  { label: "Occupation", value: "Software engineer and founder" },
  { label: "Notable projects", value: "Lumen Labs, OpenGrid, WikiMe" },
  { label: "Achievements", value: "Forbes 30 Under 30 (Technology)" },
];

export function HomeExampleArticle() {
  return (
    <section className="home-example" aria-labelledby="home-example-heading">
      <div className="home-example-header">
        <div>
          <p className="home-example-eyebrow">How it works</p>
          <h2 id="home-example-heading" className="home-example-title">
            From screenshot to Wikipedia article
          </h2>
          <p className="home-example-desc">
            Upload a LinkedIn (or similar) profile screenshot. Vision AI extracts facts, then
            generates a full biography — here is Maya Chen, our demo subject.
          </p>
        </div>
        <Link href={`/a/${EXAMPLE_ARTICLE_SLUG}`} className="home-example-cta">
          Read full article →
        </Link>
      </div>

      <div className="home-example-demo">
        <div className="home-example-demo-col">
          <p className="home-example-demo-label">1 · Profile screenshot</p>
          <MayaChenLinkedInMock />
        </div>

        <div className="home-example-demo-arrow" aria-hidden>
          <span className="home-example-demo-arrow-icon">→</span>
          <span className="home-example-demo-arrow-text">AI extracts</span>
        </div>

        <div className="home-example-demo-col">
          <p className="home-example-demo-label">2 · Extracted facts</p>
          <ul className="home-example-extracted">
            {EXTRACTED_FIELDS.map((f) => (
              <li key={f.label}>
                <span className="home-example-extracted-label">{f.label}</span>
                <span className="home-example-extracted-value">{f.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-example-demo-arrow" aria-hidden>
          <span className="home-example-demo-arrow-icon">→</span>
          <span className="home-example-demo-arrow-text">Generates</span>
        </div>

        <div className="home-example-demo-col home-example-screenshot-col">
          <p className="home-example-demo-label">3 · Wikipedia-style article</p>
          <Link
            href={`/a/${EXAMPLE_ARTICLE_SLUG}`}
            className="home-example-screenshot-link"
          >
            <Image
              src={EXAMPLE_SCREENSHOT}
              alt="Screenshot of the WikiMe example article for Maya Chen, showing infobox, table of contents, and article sections"
              width={749}
              height={1024}
              className="home-example-screenshot"
              priority
            />
            <span className="home-example-screenshot-caption">
              Sample output · Creative mode · Click to open live article
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
