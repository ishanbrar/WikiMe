import type { ArticleInfobox, IntakeData } from "@/types/article";

export type SocialPlatform = "instagram" | "linkedin" | "x" | "other";

export type SocialLink = {
  label: string;
  url: string;
  platform: SocialPlatform;
};

const PLATFORM_LABELS: Record<Exclude<SocialPlatform, "other">, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
};

/** Normalize user paste (handles, bare domains, missing scheme). */
export function normalizeSocialUrl(
  raw: string | undefined | null,
  platform?: SocialPlatform,
): string {
  let t = (typeof raw === "string" ? raw : "").trim();
  if (!t) return "";

  if (/^[@/]/.test(t)) t = t.replace(/^[@/]+/, "");

  if (platform === "instagram" && !/instagram\.com/i.test(t)) {
    const handle = t.replace(/^@/, "").split(/[/?#]/)[0] ?? "";
    if (handle && !handle.includes(".")) {
      return `https://www.instagram.com/${handle}`;
    }
  }
  if (platform === "linkedin" && !/linkedin\.com/i.test(t)) {
    if (!t.includes(".")) {
      return `https://www.linkedin.com/in/${t.replace(/^@/, "")}`;
    }
  }
  if (platform === "x" && !/(twitter|x)\.com/i.test(t)) {
    const handle = t.replace(/^@/, "").split(/[/?#]/)[0] ?? "";
    if (handle && !handle.includes(".")) {
      return `https://x.com/${handle}`;
    }
  }

  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  if (t.includes(".") && !t.includes(" ")) return `https://${t}`;
  return t;
}

export function detectSocialPlatform(url: string, label?: string): SocialPlatform {
  const u = url.toLowerCase();
  const l = (label ?? "").toLowerCase();
  if (u.includes("instagram.com") || l.includes("instagram")) return "instagram";
  if (u.includes("linkedin.com") || l.includes("linkedin")) return "linkedin";
  if (
    u.includes("twitter.com") ||
    u.includes("x.com") ||
    l === "x" ||
    l.includes("twitter")
  ) {
    return "x";
  }
  return "other";
}

function intakeSocialUrl(
  intake: IntakeData,
  key: "instagramUrl" | "linkedinUrl" | "xUrl",
): string {
  const v = intake[key];
  return typeof v === "string" ? v : "";
}

export function socialLinksFromIntake(intake: IntakeData): SocialLink[] {
  const entries: { platform: Exclude<SocialPlatform, "other">; value: string }[] =
    [
      { platform: "instagram", value: intakeSocialUrl(intake, "instagramUrl") },
      { platform: "linkedin", value: intakeSocialUrl(intake, "linkedinUrl") },
      { platform: "x", value: intakeSocialUrl(intake, "xUrl") },
    ];

  const out: SocialLink[] = [];
  for (const { platform, value } of entries) {
    const url = normalizeSocialUrl(value, platform);
    if (!url) continue;
    out.push({
      platform,
      label: PLATFORM_LABELS[platform],
      url,
    });
  }
  return out;
}

export function enrichSocialLinks(
  links: { label: string; url: string }[],
): SocialLink[] {
  return links
    .map((l) => {
      const url = normalizeSocialUrl(l?.url);
      if (!url) return null;
      const label = typeof l?.label === "string" ? l.label.trim() : "";
      return {
        label: label || "Website",
        url,
        platform: detectSocialPlatform(url, label),
      };
    })
    .filter((x): x is SocialLink => x !== null);
}

/** Intake profile URLs override AI links for the same platform; other AI links are kept. */
export function mergeSocialLinks(
  intake: IntakeData,
  aiLinks: { label: string; url: string }[],
): SocialLink[] {
  const fromIntake = socialLinksFromIntake(intake);
  const intakePlatforms = new Set(fromIntake.map((l) => l.platform));
  const fromAi = enrichSocialLinks(aiLinks).filter(
    (l) => l.platform === "other" || !intakePlatforms.has(l.platform),
  );
  return [...fromIntake, ...fromAi];
}

export function mergeSocialLinksForInfobox(
  intake: IntakeData,
  aiLinks: { label: string; url: string }[],
): ArticleInfobox["socialLinks"] {
  return mergeSocialLinks(intake, aiLinks).map(({ label, url }) => ({ label, url }));
}

export function applyIntakeSocialToInfobox(
  infobox: ArticleInfobox,
  intake: IntakeData,
): ArticleInfobox {
  return {
    ...infobox,
    socialLinks: mergeSocialLinksForInfobox(intake, infobox.socialLinks ?? []),
  };
}
