import Image from "next/image";

const HEADSHOT = "/examples/maya-chen-headshot.jpg";

/** Stylized LinkedIn profile mock for the homepage demo (not a real screenshot). */
export function MayaChenLinkedInMock() {
  return (
    <div className="linkedin-mock" aria-label="Example LinkedIn profile (illustration)">
      <div className="linkedin-mock-chrome">
        <span className="linkedin-mock-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="linkedin-mock-url">linkedin.com/in/maya-chen</span>
      </div>
      <div className="linkedin-mock-banner" />
      <div className="linkedin-mock-body">
        <div className="linkedin-mock-avatar-wrap">
          <Image
            src={HEADSHOT}
            alt=""
            width={88}
            height={88}
            className="linkedin-mock-avatar"
          />
        </div>
        <h3 className="linkedin-mock-name">Maya Chen</h3>
        <p className="linkedin-mock-headline">
          CEO at Lumen Labs · Building developer tools · Stanford CS
        </p>
        <p className="linkedin-mock-meta">San Francisco Bay Area · 500+ connections</p>
        <div className="linkedin-mock-section">
          <h4>About</h4>
          <p>
            Software engineer and founder. Previously built OpenGrid at Stanford. Forbes 30
            Under 30 (Technology). Interests: alpine climbing, vintage synthesizers.
          </p>
        </div>
        <div className="linkedin-mock-section">
          <h4>Experience</h4>
          <ul>
            <li>
              <strong>Lumen Labs</strong> — CEO · 2019–present
            </li>
            <li>
              <strong>OpenGrid</strong> — Co-creator · Stanford
            </li>
          </ul>
        </div>
        <div className="linkedin-mock-section">
          <h4>Education</h4>
          <p>
            <strong>Stanford University</strong>
            <br />
            B.S. Computer Science
          </p>
        </div>
      </div>
    </div>
  );
}
