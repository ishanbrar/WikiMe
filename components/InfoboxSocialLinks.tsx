"use client";

import {
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons/SocialBrandIcons";
import { detectSocialPlatform, enrichSocialLinks } from "@/lib/socialLinks";

function SocialIcon({ platform }: { platform: ReturnType<typeof detectSocialPlatform> }) {
  switch (platform) {
    case "instagram":
      return <InstagramIcon />;
    case "linkedin":
      return <LinkedInIcon />;
    case "x":
      return <XIcon />;
    default:
      return null;
  }
}

export function InfoboxSocialLinks({
  links,
}: {
  links: { label: string; url: string }[];
}) {
  const enriched = enrichSocialLinks(links);
  if (!enriched.length) return null;

  return (
    <tr className="wiki-infobox-social-row">
      <td colSpan={2} className="wiki-infobox-social-cell">
        <div className="wiki-infobox-social" role="list" aria-label="Social profiles">
          {enriched.map((link) => {
            const branded = link.platform !== "other";
            return (
              <a
                key={`${link.platform}-${link.url}`}
                href={link.url}
                className={[
                  "wiki-infobox-social-link",
                  branded && `wiki-infobox-social-link--${link.platform}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
                target="_blank"
                rel="noopener noreferrer"
                role="listitem"
                aria-label={link.label}
                title={link.label}
              >
                {branded ? (
                  <SocialIcon platform={link.platform} />
                ) : (
                  <span className="wiki-infobox-social-text">{link.label}</span>
                )}
              </a>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
