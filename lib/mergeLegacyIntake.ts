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
  return { ...rest, occupation, achievements };
}
