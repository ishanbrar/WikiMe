"use client";

import type { ArticleInfobox, InfoboxAllegiance } from "@/types/article";
import { WikiLinkedText } from "@/components/WikiLinkedText";
import { InfoboxSocialLinks } from "@/components/InfoboxSocialLinks";
import { extractPlaceFromBornLine, flagEmoji } from "@/lib/infoboxHelpers";
import { expandLinkTermsForInfobox, stripWikiMarkers } from "@/lib/wikipediaLinks";
import { useEffect, useMemo, useState } from "react";

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

function AllegianceList({
  items,
  properNouns,
  subjectName,
}: {
  items: InfoboxAllegiance[];
  properNouns: string[];
  subjectName: string;
}) {
  return (
    <>
      {items.map((item, i) => (
        <span key={`${item.name}-${i}`} className="wiki-infobox-allegiance-item">
          {i > 0 ? <br /> : null}
          {flagEmoji(item.flag) ? (
            <span className="wiki-flag" aria-hidden>
              {flagEmoji(item.flag)}
            </span>
          ) : null}{" "}
          <LinkedValue
            text={stripWikiMarkers(item.name)}
            properNouns={properNouns}
            subjectName={subjectName}
          />
        </span>
      ))}
    </>
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
  const [imgFailed, setImgFailed] = useState(false);
  const rawImg = infobox.imageUrl?.trim() || "";
  const img = imgFailed || !rawImg ? PLACEHOLDER : rawImg;
  const subject = subjectName || infobox.name;

  useEffect(() => {
    setImgFailed(false);
  }, [rawImg]);
  const linkTerms = useMemo(
    () => expandLinkTermsForInfobox(properNouns, infobox, subject),
    [properNouns, infobox, subject],
  );
  const bornPlace = extractPlaceFromBornLine(infobox.born);
  const hometownDisplay = extractPlaceFromBornLine(infobox.hometown);
  const showHometown =
    hometownDisplay &&
    hometownDisplay.toLowerCase() !== bornPlace.trim().toLowerCase();
  const hasMilitary =
    (infobox.allegiance?.length ?? 0) > 0 || (infobox.branch?.length ?? 0) > 0;

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
                  died: "died",
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
            <LinkedValue text={display} properNouns={linkTerms} subjectName={subject} />
          )}
        </td>
      </tr>
    );
  };

  return (
    <table className="wiki-infobox">
      <caption className="wiki-infobox-title">{infobox.name}</caption>
      <tbody>
        {infobox.titles?.length ? (
          <tr>
            <td colSpan={2} className="wiki-infobox-titles-cell">
              {infobox.titles.map((t, i) => (
                <div key={i} className="wiki-infobox-subtitle">
                  {editable ? t : stripWikiMarkers(t)}
                </div>
              ))}
            </td>
          </tr>
        ) : null}
        <tr>
          <td colSpan={2} className="wiki-infobox-image-cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={infobox.name}
              className="wiki-infobox-image"
              onError={() => setImgFailed(true)}
            />
            {infobox.caption && (
              <p className="wiki-infobox-caption">
                {editable ? (
                  infobox.caption
                ) : (
                  <LinkedValue
                    text={stripWikiMarkers(infobox.caption)}
                    properNouns={linkTerms}
                    subjectName={subject}
                  />
                )}
              </p>
            )}
          </td>
        </tr>
        {row("Born", infobox.born)}
        {row("Died", infobox.died)}
        {showHometown ? row("Hometown", hometownDisplay) : null}
        {row("Current location", infobox.currentLocation)}
        {row("Education", infobox.education)}
        {row("Occupation", infobox.occupation)}
        {row("Years active", infobox.yearsActive)}
        {hasMilitary ? (
          <tr>
            <th colSpan={2} className="wiki-infobox-section-header">
              Military career
            </th>
          </tr>
        ) : null}
        {infobox.allegiance?.length ? (
          <tr>
            <th className="wiki-infobox-label">Allegiance</th>
            <td className="wiki-infobox-data">
              <AllegianceList
                items={infobox.allegiance}
                properNouns={linkTerms}
                subjectName={subject}
              />
            </td>
          </tr>
        ) : null}
        {infobox.branch?.length ? (
          <tr>
            <th className="wiki-infobox-label">Branch</th>
            <td className="wiki-infobox-data">
              <AllegianceList
                items={infobox.branch}
                properNouns={linkTerms}
                subjectName={subject}
              />
            </td>
          </tr>
        ) : null}
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
                      <LinkedValue text={k} properNouns={linkTerms} subjectName={subject} />
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
                  properNouns={linkTerms}
                  subjectName={subject}
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
                      <LinkedValue text={a} properNouns={linkTerms} subjectName={subject} />
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ) : null}
        <InfoboxSocialLinks links={infobox.socialLinks ?? []} />
      </tbody>
    </table>
  );
}
