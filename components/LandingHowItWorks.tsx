import { Fragment } from "react";

function UploadIcon() {
  return (
    <svg
      className="landing-step-icon-svg"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 30V18M24 18l-6 6M24 18l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg
      className="landing-step-icon-svg"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 8h20l8 8v24a2 2 0 01-2 2H12a2 2 0 01-2-2V10a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M30 8v8h8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 22h16M16 28h16M16 34h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="28" y="4" width="12" height="12" rx="2" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      className="landing-step-icon-svg"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="34" cy="14" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="34" cy="34" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18.5 21.5l10-4M18.5 26.5l10 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepArrow() {
  return (
    <li className="landing-step-connector" aria-hidden>
      <svg className="landing-step-arrow-h" viewBox="0 0 40 24" fill="none">
        <path
          d="M4 12h28m0 0l-6-6m6 6l-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="landing-step-arrow-v" viewBox="0 0 24 40" fill="none">
        <path
          d="M12 4v28m0 0l-6-6m6 6l6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </li>
  );
}

const STEPS = [
  {
    icon: UploadIcon,
    title: "Upload & extract",
    text: "Vision AI reads your LinkedIn, Instagram, or portfolio screenshots and extracts compact facts.",
    accent: "upload",
  },
  {
    icon: ArticleIcon,
    title: "Wikipedia layout",
    text: "Infobox, table of contents, references, and encyclopedic typography.",
    accent: "article",
  },
  {
    icon: ShareIcon,
    title: "Save & share",
    text: "Every article gets a unique link. Sign up to save articles to your account and revisit them anytime.",
    accent: "share",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section className="landing-how-it-works" aria-label="How WikiMe works">
      <ol className="landing-steps">
        {STEPS.map((step, i) => (
          <Fragment key={step.title}>
            <li className="landing-step-item">
              <article className={`landing-step landing-step--${step.accent}`}>
                <div className="landing-step-icon-wrap">
                  <step.icon />
                </div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-text">{step.text}</p>
              </article>
            </li>
            {i < STEPS.length - 1 && <StepArrow />}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
