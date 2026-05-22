import type { ArticleMode, IntakeData } from "@/types/article";

/** Merge removed intake fields from older saved drafts. */
export function mergeLegacyIntakeFields(
  o: Record<string, unknown>,
): Record<string, unknown> {
  const occ =
    typeof o.occupation === "string" ? o.occupation.trim() : "";
  const role =
    typeof o.currentRole === "string" ? o.currentRole.trim() : "";
  let occupation = occ;
  if (role) {
    occupation =
      occ && occ !== role ? `${occ} — ${role}` : role;
  }

  const ach =
    typeof o.achievements === "string" ? o.achievements.trim() : "";
  const skills =
    typeof o.skills === "string" ? o.skills.trim() : "";
  let achievements = ach;
  if (skills) {
    achievements =
      ach && ach !== skills ? `${ach}; ${skills}` : skills;
  }

  const {
    currentRole: _r,
    notableProjects: _p,
    interests: _i,
    skills: _s,
    ...rest
  } = o;
  return {
    ...rest,
    occupation,
    achievements,
    instagramUrl: typeof rest.instagramUrl === "string" ? rest.instagramUrl : "",
    linkedinUrl: typeof rest.linkedinUrl === "string" ? rest.linkedinUrl : "",
    xUrl: typeof rest.xUrl === "string" ? rest.xUrl : "",
  };
}

/** Articles saved before social fields were added omit them on intake JSON. */
export function normalizeStoredIntake(raw: unknown): IntakeData {
  const o = mergeLegacyIntakeFields(
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
  );
  const mode: ArticleMode = o.mode === "creative" ? "creative" : "realism";
  const str = (key: keyof IntakeData) =>
    typeof o[key] === "string" ? (o[key] as string) : "";

  return {
    fullName: str("fullName"),
    articleTitle: str("articleTitle") || str("fullName"),
    birthplace: str("birthplace"),
    birthday: str("birthday"),
    deathDate: str("deathDate"),
    currentLocation: str("currentLocation"),
    education: str("education"),
    occupation: str("occupation"),
    achievements: str("achievements"),
    lifeEvents: str("lifeEvents"),
    controversies: str("controversies"),
    tone:
      o.tone === "founder" ||
      o.tone === "athlete" ||
      o.tone === "academic" ||
      o.tone === "artist" ||
      o.tone === "funny" ||
      o.tone === "legendary" ||
      o.tone === "mysterious"
        ? o.tone
        : "neutral",
    mode,
    extraNotes: str("extraNotes"),
    pastedProfileText: str("pastedProfileText"),
    articleLength:
      o.articleLength === "short" || o.articleLength === "long"
        ? o.articleLength
        : "standard",
    instagramUrl: str("instagramUrl"),
    linkedinUrl: str("linkedinUrl"),
    xUrl: str("xUrl"),
  };
}
