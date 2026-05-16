import type { User } from "@supabase/supabase-js";

const DEFAULT_ADMIN_EMAIL = "admin@sikhomode.org";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAIL;
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase();
  if (getAdminEmails().includes(email)) return true;
  const role = user.app_metadata?.role;
  return role === "admin";
}

export function requireAdminUser(user: User | null | undefined): void {
  if (!isAdminUser(user)) {
    throw new Error("Forbidden");
  }
}
