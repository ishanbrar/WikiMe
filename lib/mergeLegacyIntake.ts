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

  const { currentRole: _r, notableProjects: _p, interests: _i, ...rest } = o;
  return { ...rest, occupation };
}
