import type { IntakeData } from "@/types/article";

export interface CreativeBrief {
  seed: string;
  narrativeAngle: string;
  tonalFlavor: string;
  mythicFrame: string;
  plotDevices: string[];
  mustWeaveFromInputs: string[];
  avoidGenericPhrases: string[];
}

const ANGLES = [
  "reluctant legend — fame arrived despite personal modesty",
  "controversial rise — admirers and skeptics debate every milestone",
  "forgotten architect — influence is vast but attribution is disputed",
  "renaissance operator — pivots between disciplines with improbable success",
  "institutional myth-maker — reshaped an entire field through sheer will",
  "geopolitical chess player — local actions ripple into global consequences",
  "underground cult figure — mainstream recognition came late and unevenly",
  "dynastic outlier — broke from family tradition in a dramatic rupture",
  "prophetic technocrat — predictions eerily matched later events",
  "accidental hero — pivotal moments stemmed from improvisation, not planning",
];

const FLAVORS = [
  "dry wit bleeding through neutral prose",
  "foreshadowing in understated asides",
  "rivalry subplots threaded through career sections",
  "oral-history contradictions left unresolved",
  "museum-catalog gravitas with surreal details",
  "tabloid facts delivered in academic register",
  "epoch-spanning scope with intimate vignettes",
];

const MYTHIC_FRAMES = [
  "treat their career as a three-act epic with a midpoint reversal",
  "structure the biography around a single symbolic object or place from the inputs",
  "frame achievements around a recurring motif only they could embody",
  "present public life as performance and private life as counter-melody",
  "use recurring motifs (weather, maps, uniforms, machines) as narrative glue",
];

const PLOT_DEVICES = [
  "a mysterious mentor referenced but never fully named",
  "a rivalry that escalates across two decades",
  "a project that failed publicly then succeeded in secret",
  "a diplomatic incident that reframes earlier accomplishments",
  "an award ceremony that goes off-script",
  "a lost manuscript / leaked memo that changes the narrative",
  "a pilgrimage or exile that becomes turning point",
  "a patron or institution that betrays then reconciles",
  "a protege who surpasses them controversially",
  "a geographic move that alters their reputation entirely",
];

const BANNED_GENERIC = [
  "limited details are available",
  "little is known about",
  "according to user-provided information",
  "documented in this user-generated profile",
  "remains private",
  "not extensively documented",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function collectInputHooks(intake: IntakeData): string[] {
  const hooks: string[] = [];
  const add = (label: string, val?: string) => {
    const v = val?.trim();
    if (v) hooks.push(`${label}: ${v}`);
  };
  add("name", intake.fullName);
  add("title", intake.articleTitle);
  add("birthplace", intake.birthplace);
  add("birthday", intake.birthday);
  add("death date", intake.deathDate);
  add("location", intake.currentLocation);
  add("education", intake.education);
  add("occupation", intake.occupation);
  add("achievements", intake.achievements);
  add("skills", intake.skills);
  add("life events", intake.lifeEvents);
  add("notes", intake.extraNotes);
  if (intake.pastedProfileText?.trim()) {
    hooks.push(`profile excerpt: ${intake.pastedProfileText.slice(0, 400)}`);
  }
  return hooks;
}

export function buildCreativeBrief(intake: IntakeData): CreativeBrief {
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    seed,
    narrativeAngle: pick(ANGLES),
    tonalFlavor: pick(FLAVORS),
    mythicFrame: pick(MYTHIC_FRAMES),
    plotDevices: pickMany(PLOT_DEVICES, 3),
    mustWeaveFromInputs: collectInputHooks(intake),
    avoidGenericPhrases: BANNED_GENERIC,
  };
}

export function creativeLengthHint(len: IntakeData["articleLength"]): string {
  if (len === "short") {
    return "TARGET ~900–1200 words total. At least 5 sections, 2–3 paragraphs each. Subsections only where needed (0–2 per section). Lead: 2 paragraphs.";
  }
  if (len === "long") {
    return "TARGET ~2800–3500 words total. At least 7 sections with rich paragraphs; 1–2 subsections only in long sections like Career. Lead: 4 paragraphs.";
  }
  return "TARGET ~1800–2400 words total. At least 6 generic sections with 2–4 paragraphs each; use subsections sparingly (mostly in Career/Legacy). Lead: 3–4 paragraphs.";
}

export function formatCreativeBrief(brief: CreativeBrief): string {
  return JSON.stringify(brief, null, 2);
}
