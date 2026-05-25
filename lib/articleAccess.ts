import type { User } from "@supabase/supabase-js";
import { isAdminUser } from "@/lib/admin";
import type { SavedArticle } from "@/types/article";

/** Owner or WikiMe admin may update a saved article. */
export function canEditArticle(
  user: User | null | undefined,
  article: Pick<SavedArticle, "userId" | "creatorEmail"> | null | undefined,
): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (!article) return false;
  if (article.userId && user.id === article.userId) return true;
  return Boolean(
    user.email &&
      article.creatorEmail &&
      user.email.toLowerCase() === article.creatorEmail.toLowerCase(),
  );
}
