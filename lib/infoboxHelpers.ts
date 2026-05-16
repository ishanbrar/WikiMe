import type { ArticleInfobox, InfoboxAllegiance, IntakeData } from "@/types/article";

export const INFOBOX_RULES = `INFOBOX (Wikipedia biography style — like Akbar):
- titles[]: honorifics/epithets shown under the name (e.g. "Padishah", "Ghazi", "Colonel") — omit if none apply.
- born: birth date (invented if needed) + full place: "City, Region, Country" with modern country name (e.g. "14 October 1994, Dallas, Texas, U.S."). Never only "Dallas".
- died: death date + full place if deceased; use "" or omit if still living.
- hometown: place only (no birth date) — e.g. "Dallas, Texas, U.S."; never repeat the full born line with date.
- currentLocation: full "City, State/Region, Country" (e.g. "New York City, New York, U.S." not "NYC").
- allegiance[]: { "name": "United States", "flag": "US" } — ISO 3166-1 alpha-2 code for flag icon (US, GB, IN, PK…). Use when military/political loyalty applies.
- branch[]: optional { "name": "Unit or organization", "flag": "US" } under Military career block.
- Expand every geographic name using judgment; include state/province and country even if user input was only a city.`;

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  "united states": "US",
  america: "US",
  uk: "GB",
  "united kingdom": "GB",
  india: "IN",
  pakistan: "PK",
  china: "CN",
  canada: "CA",
  australia: "AU",
  france: "FR",
  germany: "DE",
  mexico: "MX",
};

/** ISO alpha-2 → flag emoji (Wikipedia-style inline flags). */
export function flagEmoji(isoOrName?: string): string {
  if (!isoOrName) return "";
  const raw = isoOrName.trim();
  if (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(raw)) return raw;

  let code = raw.toUpperCase();
  if (code.length !== 2) {
    const key = raw.toLowerCase();
    code = COUNTRY_ALIASES[key] ?? "";
  }
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return "";

  const points = [...code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}

export function parseAllegianceList(raw: unknown): InfoboxAllegiance[] {
  if (!Array.isArray(raw)) return [];
  const out: InfoboxAllegiance[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      const entry: InfoboxAllegiance = { name: item.trim() };
      const code = guessFlagCode(item);
      if (code) entry.flag = code;
      out.push(entry);
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : typeof o.label === "string" ? o.label : "";
      if (!name.trim()) continue;
      const entry: InfoboxAllegiance = { name: name.trim() };
      const flag =
        typeof o.flag === "string"
          ? o.flag
          : typeof o.iso === "string"
            ? o.iso
            : guessFlagCode(name);
      if (flag) entry.flag = flag.toUpperCase();
      out.push(entry);
    }
  }
  return out;
}

function guessFlagCode(placeName: string): string | undefined {
  const lower = placeName.toLowerCase();
  for (const [key, code] of Object.entries(COUNTRY_ALIASES)) {
    if (lower.includes(key)) return code;
  }
  if (lower.includes("mughal") || lower.includes("india")) return "IN";
  if (lower.includes("american") || lower.includes("u.s.")) return "US";
  return undefined;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

/** Remove a leading birth date from a born line; returns place-only text. */
export function extractPlaceFromBornLine(born: string): string {
  const t = born.trim();
  if (!t) return "";
  const month =
    "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan\\.?|Feb\\.?|Mar\\.?|Apr\\.?|Jun\\.?|Jul\\.?|Aug\\.?|Sep(?:t)?\\.?|Oct\\.?|Nov\\.?|Dec\\.?)";
  const dated = t.match(
    new RegExp(
      `^(?:\\d{1,2}\\s+${month}\\s+\\d{4}|c\\.?\\s*\\d{4}|\\d{4})\\s*,\\s*(.+)$`,
      "i",
    ),
  );
  if (dated) return dated[1].trim();
  const unknown = t.match(/^unknown\s+date\s*,\s*(.+)$/i);
  if (unknown) return unknown[1].trim();
  if (/^(?:\d{1,2}\s+\w+|\d{4}|c\.)/i.test(t) && t.includes(",")) {
    const after = t.indexOf(",");
    return t.slice(after + 1).trim();
  }
  return t;
}

function normalizeHometown(hometownRaw: string, born: string, birthplace: string): string {
  const bornPlace = extractPlaceFromBornLine(born);
  let hometown = hometownRaw.trim() || birthplace.trim();
  hometown = pickRicherPlace(hometown, bornPlace);
  if (hometown.trim().toLowerCase() === born.trim().toLowerCase()) {
    hometown = bornPlace;
  }
  if (/^(?:\d{1,2}\s+\w+|\d{4}|c\.)/i.test(hometown)) {
    hometown = extractPlaceFromBornLine(hometown) || bornPlace;
  }
  return hometown;
}

function pickRicherPlace(short: string, rich: string): string {
  const a = short.trim();
  const b = rich.trim();
  if (!a) return b;
  if (!b) return a;
  if (b.length > a.length && b.toLowerCase().includes(a.toLowerCase().split(",")[0]!)) {
    return b;
  }
  if (a.includes(",") && !b.includes(",")) return a;
  if (b.includes(",") && !a.includes(",")) return b;
  return a.length >= b.length ? a : b;
}

export function normalizeInfobox(
  inf: Record<string, unknown>,
  intake: IntakeData,
  headshotUrl: string,
): ArticleInfobox {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v : v == null ? fallback : String(v);

  const born = pickRicherPlace(
    str(inf.born),
    intake.birthplace ? `Unknown date, ${intake.birthplace}` : "",
  );
  const hometown = normalizeHometown(str(inf.hometown, intake.birthplace), born, intake.birthplace);
  const currentLocation = pickRicherPlace(
    str(inf.currentLocation, intake.currentLocation),
    intake.currentLocation,
  );

  return {
    name: str(inf.name, intake.fullName),
    imageUrl: str(inf.imageUrl, headshotUrl),
    caption: str(inf.caption, ""),
    titles: strArr(inf.titles),
    born,
    died: str(inf.died, ""),
    hometown,
    currentLocation,
    education: str(inf.education, intake.education),
    occupation: str(inf.occupation, intake.occupation),
    yearsActive: str(inf.yearsActive, ""),
    knownFor: strArr(inf.knownFor),
    notableWorks: strArr(inf.notableWorks),
    awards: strArr(inf.awards),
    allegiance: parseAllegianceList(inf.allegiance),
    branch: parseAllegianceList(inf.branch),
    socialLinks: Array.isArray(inf.socialLinks)
      ? (inf.socialLinks as unknown[])
          .map((l) => {
            const link = l as Record<string, unknown>;
            const label = str(link.label);
            const url = str(link.url);
            return label && url ? { label, url } : null;
          })
          .filter((x): x is { label: string; url: string } => x !== null)
      : [],
  };
}
