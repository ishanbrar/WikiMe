import type { User } from "@supabase/supabase-js";
import { isAdminUser } from "@/lib/admin";
import type { SavedArticle } from "@/types/article";

/** Owner or WikiMe admin may update a saved article. */
export function canEditArticle(
  user: User | null | undefined,
  article: Pick<SavedArticle, "userId"> | null | undefined,
): boolean {
  if (!article) return true;
  if (!article.userId) return true;
  if (!user) return false;
  if (user.id === article.userId) return true;
  return isAdminUser(user);
}
