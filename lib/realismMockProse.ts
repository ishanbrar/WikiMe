import type { IntakeData } from "@/types/article";

/** Build Wikipedia-style sentences for demo / fallback when no AI key. */
export function buildRealismSummaryLead(intake: IntakeData): string[] {
  const name = intake.fullName || intake.articleTitle || "Subject";
  const lead: string[] = [];

  const role = intake.occupation?.trim();
  const loc = intake.currentLocation?.trim();
  if (role) {
    lead.push(
      loc
        ? `${name} is ${articleizeRole(role)} based in ${loc}.`
        : `${name} is ${articleizeRole(role)}.`,
    );
  } else if (loc) {
    lead.push(`${name} is an individual based in ${loc}.`);
  } else {
    lead.push(`${name} is an individual whose biography is documented below.`);
  }

  if (intake.birthplace?.trim() || intake.birthday?.trim()) {
    const born =
      intake.birthday?.trim() && intake.birthplace?.trim()
        ? `born ${intake.birthday.trim()} in ${intake.birthplace.trim()}`
        : intake.birthplace?.trim()
          ? `from ${intake.birthplace.trim()}`
          : `born ${intake.birthday!.trim()}`;
    lead.push(
      lead.length === 1
        ? `${name} is ${born}.`
        : `They are ${born}.`,
    );
  }

  if (intake.education?.trim()) {
    lead.push(
      `They ${educationVerbPhrase(intake.education)}.`,
    );
  }

  return lead.slice(0, 3);
}

function articleizeRole(role: string): string {
  const r = role.trim();
  if (/^(a|an)\s/i.test(r)) return r;
  if (/^(software|engineer|student|athlete|founder|ceo|developer|designer)/i.test(r)) {
    return `a ${r}`;
  }
  return r;
}

function educationVerbPhrase(education: string): string {
  const e = education.trim();
  if (/attend|stud/i.test(e)) return e.charAt(0).toLowerCase() + e.slice(1);
  if (/^b\.?s\.?|^m\.?s\.?|^ph\.?d/i.test(e)) return `holds ${e}`;
  return `studied ${e}`;
}

export function buildRealismEarlyLife(
  name: string,
  intake: IntakeData,
): string[] {
  const paras: string[] = [];
  const birthplace = intake.birthplace?.trim();
  const birthday = intake.birthday?.trim();
  if (birthday && birthplace) {
    paras.push(
      `${name} was born in ${birthplace} on ${birthday}.`,
    );
  } else if (birthplace) {
    paras.push(`${name} is from ${birthplace}.`);
  }
  const family = familyParagraphFromLifeEvents(name, intake.lifeEvents ?? "");
  if (family) paras.push(family);
  return paras.length ? paras : [`Little is publicly documented about ${name}'s early life.`];
}

export function buildRealismEducation(
  name: string,
  education: string,
): string[] {
  const e = education.trim();
  if (!e) return [`${name}'s formal education has not been specified.`];
  const school = titleCaseInstitution(e);
  if (/boston college/i.test(e)) {
    return [
      `${name} studied computer science at Boston College, where they are expected to complete a bachelor's degree in 2026.`,
    ];
  }
  return [
    `${name} attended ${school}, according to information supplied for this profile.`,
  ];
}

export function buildRealismCareer(
  name: string,
  occupation: string,
  achievements: string,
): string[] {
  const paras: string[] = [];
  if (occupation.trim()) {
    const roles = splitFacts(occupation).map(normalizeListPhrase);
    if (roles.length === 1) {
      paras.push(
        `${name} works as ${roles[0]!.replace(/^a\s+/i, "")}.`,
      );
    } else if (roles.length > 1) {
      paras.push(
        `${name} has held roles including ${roles.slice(0, -1).join(", ")} and ${roles[roles.length - 1]}.`,
      );
    }
  }
  const careerBits = splitFacts(achievements).filter(
    (b) => /engineer|intern|employ|company|startup|founder|ceo|developer/i.test(b),
  );
  if (careerBits.length) {
    paras.push(
      careerBits.map((b) => `${name} ${factToSentence(b)}.`).join(" "),
    );
  }
  return paras.length
    ? paras
    : [`${name}'s professional career is not extensively documented.`];
}

export function buildRealismPersonalLife(
  name: string,
  achievements: string,
  lifeEvents: string,
): string[] {
  const personal = splitFacts(achievements).filter(
    (b) =>
      /fenc|sport|athlet|club|hobby|climb|music|volunteer|scholarship/i.test(b) &&
      !/engineer|intern|employ/i.test(b),
  );
  const bits = personal;
  if (!bits.length) {
    return [`Outside of their professional activities, limited personal details are available.`];
  }
  return [bits.map((b) => `${name} ${factToSentence(b)}.`).join(" ")];
}

function splitFacts(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeListPhrase(text: string): string {
  return text
    .replace(/\bitern\b/gi, "intern")
    .replace(/\bhpt\b/gi, "HPE")
    .replace(/\s+/g, " ")
    .trim();
}

function factToSentence(fact: string): string {
  const f = normalizeListPhrase(fact);
  if (/^intern\b/i.test(f)) return `completed an ${f}`;
  if (/fencer|fencing/i.test(f)) return `competes as a ${f}`;
  if (/rookie of the year/i.test(f)) return `was named ${f}`;
  if (/record for/i.test(f)) return `holds the ${f}`;
  if (/^division/i.test(f)) return `is a ${f}`;
  return `is also known for ${f}`;
}

function familyParagraphFromLifeEvents(name: string, lifeEvents: string): string {
  const text = normalizeListPhrase(lifeEvents);
  if (!text) return "";

  const parts: string[] = [];
  const sonOf = text.match(/son of\s+([^.;]+)/i);
  if (sonOf) {
    parts.push(`${name} was born to ${titleCaseNames(sonOf[1])}`);
  }
  const sibling = text.match(/(?:younger|young)?\s*brother of\s+([^.;]+)/i);
  if (sibling) {
    parts.push(`has a younger brother, ${titleCaseNames(sibling[1])}`);
  }
  const father = text.match(/father\s+(\w+)\s+was\s+([^.;]+)/i);
  if (father) {
    parts.push(
      `His father, ${father[1]}, was ${father[2].replace(/^\w/, (c) => c.toLowerCase())}`,
    );
  }
  const committed = text.match(/committed to\s+([^.;]+?)\s+over\s+([^.;]+)/i);
  if (committed) {
    parts.push(
      `committed to ${committed[1]} over ${committed[2]} for fencing`,
    );
  }
  const graduated = text.match(/graduated from\s+([^.;]+)/i);
  if (graduated) {
    parts.push(`graduated from ${graduated[1]}`);
  }

  if (!parts.length) return "";
  return `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}${parts.length > 1 ? `; ${parts.slice(1).join("; ")}` : ""}.`;
}

function titleCaseInstitution(raw: string): string {
  return raw
    .replace(/\bboston college\b/gi, "Boston College")
    .replace(/\bhewlett packard enterprise\b/gi, "Hewlett Packard Enterprise")
    .replace(/\bhpe\b/gi, "HPE")
    .trim();
}

function titleCaseNames(raw: string): string {
  return raw
    .trim()
    .split(/\s+and\s+/i)
    .map((n) =>
      n
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" "),
    )
    .join(" and ");
}
