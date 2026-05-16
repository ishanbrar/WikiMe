import Link from "next/link";
import { getExampleArticle } from "@/lib/exampleArticle";
import { EXAMPLE_ARTICLE_SLUG } from "@/lib/exampleArticle";

export function HomeExampleArticle() {
  const example = getExampleArticle();
  const { articleJson: article } = example;
  const lead = article.summaryLead[0] ?? "";

  return (
    <section className="home-example" aria-labelledby="home-example-heading">
      <div className="home-example-header">
        <div>
          <p className="home-example-eyebrow">Sample output</p>
          <h2 id="home-example-heading" className="home-example-title">
            See what WikiMe generates
          </h2>
          <p className="home-example-desc">
            A Creative Mode biography with infobox, sections, and encyclopedic tone — no upload required to preview.
          </p>
        </div>
        <Link href={`/a/${EXAMPLE_ARTICLE_SLUG}`} className="home-example-cta">
          Read full article →
        </Link>
      </div>

      <article className="home-example-card">
        <div className="home-example-card-badge">Creative mode · Demo</div>
        <h3 className="home-example-article-title">{article.title}</h3>
        {article.subtitle && (
          <p className="home-example-subtitle">{article.subtitle}</p>
        )}
        <p className="home-example-lead">{lead}</p>
        <dl className="home-example-infobox">
          <div>
            <dt>Born</dt>
            <dd>{article.infobox.born || "—"}</dd>
          </div>
          <div>
            <dt>Occupation</dt>
            <dd>{article.infobox.occupation || "—"}</dd>
          </div>
          <div>
            <dt>Known for</dt>
            <dd>{article.infobox.knownFor.slice(0, 2).join(", ") || "—"}</dd>
          </div>
        </dl>
        <ul className="home-example-toc">
          {article.sections.slice(0, 3).map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
