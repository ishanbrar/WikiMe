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
  if (intake.lifeEvents?.trim()) {
    paras.push(expandLifeEvents(name, intake.lifeEvents));
  }
  return paras.length ? paras : [`Little is publicly documented about ${name}'s early life.`];
}

export function buildRealismEducation(
  name: string,
  education: string,
): string[] {
  const e = education.trim();
  if (!e) return [`${name}'s formal education has not been specified.`];
  return [`${name} ${educationVerbPhrase(e)}.`];
}

export function buildRealismCareer(
  name: string,
  occupation: string,
  achievements: string,
): string[] {
  const paras: string[] = [];
  if (occupation.trim()) {
    paras.push(
      `${name} has worked in roles including ${normalizeListPhrase(occupation)}.`,
    );
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
  const fromLife = splitFacts(lifeEvents).filter(
    (b) => !/born|relocat/i.test(b),
  );
  const bits = [...personal, ...fromLife];
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

function expandLifeEvents(name: string, lifeEvents: string): string {
  const parts = splitFacts(lifeEvents);
  if (!parts.length) return "";
  return parts.map((p) => `${name} ${p.replace(/^\w/, (c) => c.toLowerCase())}.`).join(" ");
}
