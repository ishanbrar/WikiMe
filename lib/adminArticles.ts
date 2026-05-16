import { promises as fs } from "fs";
import path from "path";
import type { ArticleMode } from "@/types/article";
import { getAppBaseUrl } from "@/lib/appUrl";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { isVercelDeployment } from "@/lib/appUrl";
import type { SavedArticle } from "@/types/article";

export type AdminArticleLogRow = {
  id: string;
  slug: string;
  title: string;
  mode: ArticleMode;
  createdAt: string;
  creatorEmail: string | null;
  userId: string | null;
  articleUrl: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "articles");

type ArticleRow = {
  id: string;
  slug: string;
  article_json: { title?: string };
  mode: ArticleMode;
  user_id: string | null;
  creator_email: string | null;
  created_at: string;
};

async function resolveCreatorEmails(
  rows: { user_id: string | null; creator_email: string | null }[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const missing = [
    ...new Set(
      rows
        .filter((r) => r.user_id && !r.creator_email?.trim())
        .map((r) => r.user_id as string),
    ),
  ];
  if (missing.length === 0) return map;

  const supabase = getSupabaseAdmin();
  await Promise.all(
    missing.map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (!error && data.user?.email) {
        map.set(userId, data.user.email);
      }
    }),
  );
  return map;
}

export async function listAdminArticleLog(
  request?: Request,
): Promise<AdminArticleLogRow[]> {
  const base = getAppBaseUrl(request);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, slug, article_json, mode, user_id, creator_email, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as ArticleRow[];
    const emailByUserId = await resolveCreatorEmails(rows);

    return rows.map((row) => {
      const title =
        row.article_json?.title?.trim() || row.slug || "Untitled";
      const creatorEmail =
        row.creator_email?.trim() ||
        (row.user_id ? emailByUserId.get(row.user_id) ?? null : null);
      return {
        id: row.id,
        slug: row.slug,
        title,
        mode: row.mode,
        createdAt: row.created_at,
        creatorEmail,
        userId: row.user_id,
        articleUrl: `${base}/a/${row.slug}`,
      };
    });
  }

  if (isVercelDeployment()) {
    return [];
  }

  try {
    const files = await fs.readdir(DATA_DIR);
    const articles: AdminArticleLogRow[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      const saved = JSON.parse(raw) as SavedArticle;
      articles.push({
        id: saved.id,
        slug: saved.slug,
        title: saved.articleJson.title || saved.slug,
        mode: saved.mode,
        createdAt: saved.createdAt,
        creatorEmail: null,
        userId: saved.userId ?? null,
        articleUrl: `${base}/a/${saved.slug}`,
      });
    }
    return articles.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  } catch {
    return [];
  }
}
