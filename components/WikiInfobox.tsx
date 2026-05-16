"use client";

import type { ArticleInfobox } from "@/types/article";
import { WikiLinkedText } from "@/components/WikiLinkedText";
import { stripWikiMarkers } from "@/lib/wikipediaLinks";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280" viewBox="0 0 220 280"><rect fill="#eaecf0" width="220" height="280"/><text x="110" y="145" text-anchor="middle" fill="#72777d" font-family="sans-serif" font-size="14">No image</text></svg>`,
  );

function LinkedValue({
  text,
  properNouns,
  subjectName,
}: {
  text: string;
  properNouns: string[];
  subjectName: string;
}) {
  return (
    <WikiLinkedText
      text={text}
      properNouns={properNouns}
      subjectName={subjectName}
      maxLinksPerTerm={2}
    />
  );
}

export function WikiInfobox({
  infobox,
  properNouns = [],
  subjectName = "",
  editable,
  onChange,
}: {
  infobox: ArticleInfobox;
  properNouns?: string[];
  subjectName?: string;
  editable?: boolean;
  onChange?: (infobox: ArticleInfobox) => void;
}) {
  const img = infobox.imageUrl || PLACEHOLDER;
  const row = (label: string, value: string | string[] | undefined) => {
    if (!value || (Array.isArray(value) && !value.length)) return null;
    const raw = Array.isArray(value) ? value.join(", ") : value;
    const display = stripWikiMarkers(raw);
    return (
      <tr key={label}>
        <th className="wiki-infobox-label">{label}</th>
        <td className="wiki-infobox-data">
          {editable && onChange ? (
            <input
              className="wiki-edit-input w-full"
              value={display}
              onChange={(e) => {
                const map: Record<string, keyof ArticleInfobox> = {
                  born: "born",
                  hometown: "hometown",
                  currentlocation: "currentLocation",
                  education: "education",
                  occupation: "occupation",
                  yearsactive: "yearsActive",
                };
                const field = map[label.toLowerCase().replace(/\s+/g, "")];
                if (field) onChange({ ...infobox, [field]: e.target.value });
              }}
            />
          ) : (
            <LinkedValue
              text={display}
              properNouns={properNouns}
              subjectName={subjectName || infobox.name}
            />
          )}
        </td>
      </tr>
    );
  };

  return (
    <table className="wiki-infobox">
      <caption className="wiki-infobox-title">{infobox.name}</caption>
      <tbody>
        <tr>
          <td colSpan={2} className="wiki-infobox-image-cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={infobox.name} className="wiki-infobox-image" />
            {infobox.caption && (
              <p className="wiki-infobox-caption">
                {editable ? (
                  infobox.caption
                ) : (
                  <LinkedValue
                    text={stripWikiMarkers(infobox.caption)}
                    properNouns={properNouns}
                    subjectName={subjectName || infobox.name}
                  />
                )}
              </p>
            )}
          </td>
        </tr>
        {row("Born", infobox.born)}
        {row("Hometown", infobox.hometown)}
        {row("Current location", infobox.currentLocation)}
        {row("Education", infobox.education)}
        {row("Occupation", infobox.occupation)}
        {row("Years active", infobox.yearsActive)}
        {infobox.knownFor?.length ? (
          <tr>
            <th className="wiki-infobox-label">Known for</th>
            <td className="wiki-infobox-data">
              <ul className="list-disc pl-4">
                {infobox.knownFor.map((k, i) => (
                  <li key={i}>
                    {editable ? (
                      k
                    ) : (
                      <LinkedValue
                        text={k}
                        properNouns={properNouns}
                        subjectName={subjectName || infobox.name}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        ) : null}
        {infobox.notableWorks?.length ? (
          <tr>
            <th className="wiki-infobox-label">Notable works</th>
            <td className="wiki-infobox-data">
              {editable ? (
                infobox.notableWorks.join(", ")
              ) : (
                <LinkedValue
                  text={infobox.notableWorks.join(", ")}
                  properNouns={properNouns}
                  subjectName={subjectName || infobox.name}
                />
              )}
            </td>
          </tr>
        ) : null}
        {infobox.awards?.length ? (
          <tr>
            <th className="wiki-infobox-label">Awards</th>
            <td className="wiki-infobox-data">
              {editable ? (
                infobox.awards.join(", ")
              ) : (
                <ul className="list-disc pl-4">
                  {infobox.awards.map((a, i) => (
                    <li key={i}>
                      <LinkedValue
                        text={a}
                        properNouns={properNouns}
                        subjectName={subjectName || infobox.name}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ) : null}
        {infobox.socialLinks?.length ? (
          <tr>
            <th className="wiki-infobox-label">Website</th>
            <td className="wiki-infobox-data">
              {infobox.socialLinks.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  className="wiki-link block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {l.label}
                </a>
              ))}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
