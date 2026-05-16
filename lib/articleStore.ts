import { promises as fs } from "fs";
import path from "path";
import type { ArticleListItem, SavedArticle } from "@/types/article";
import { isVercelDeployment } from "@/lib/appUrl";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { EXAMPLE_ARTICLE_SLUG, getExampleArticle } from "@/lib/exampleArticle";
import { withHeadshotOnSaved } from "@/lib/headshotForArticle";

function requirePersistentStorage(): void {
  if (isSupabaseConfigured()) return;
  if (isVercelDeployment()) {
    throw new Error(
      "Server storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel project environment variables.",
    );
  }
}

const DATA_DIR = path.join(process.cwd(), "data", "articles");

type ArticleRow = {
  id: string;
  slug: string;
  article_json: SavedArticle["articleJson"];
  mode: SavedArticle["mode"];
  intake: SavedArticle["intake"];
  headshot_data_url: string | null;
  extracted_facts: SavedArticle["extractedFacts"] | null;
  user_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

function rowToSaved(row: ArticleRow): SavedArticle {
  return {
    id: row.id,
    slug: row.slug,
    articleJson: row.article_json,
    mode: row.mode,
    intake: row.intake,
    headshotDataUrl: row.headshot_data_url ?? undefined,
    extractedFacts: row.extracted_facts ?? undefined,
    userId: row.user_id ?? undefined,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function savedToRow(article: SavedArticle): ArticleRow {
  return {
    id: article.id,
    slug: article.slug,
    article_json: article.articleJson,
    mode: article.mode,
    intake: article.intake,
    headshot_data_url: article.headshotDataUrl ?? null,
    extracted_facts: article.extractedFacts ?? null,
    user_id: article.userId ?? null,
    is_public: article.isPublic ?? true,
    created_at: article.createdAt,
    updated_at: article.updatedAt,
  };
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function saveArticleFile(article: SavedArticle): Promise<void> {
  await ensureDir();
  const file = path.join(DATA_DIR, `${article.slug}.json`);
  await fs.writeFile(file, JSON.stringify(article, null, 2), "utf-8");
}

async function getArticleBySlugFile(slug: string): Promise<SavedArticle | null> {
  try {
    const file = path.join(DATA_DIR, `${slug}.json`);
    const raw = await fs.readFile(file, "utf-8");
    return withHeadshotOnSaved(JSON.parse(raw) as SavedArticle);
  } catch {
    return null;
  }
}

async function saveArticleSupabase(article: SavedArticle): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row = savedToRow(article);
  const { error } = await supabase.from("articles").upsert(row, {
    onConflict: "slug",
  });
  if (error) throw new Error(error.message);
}

async function getArticleBySlugSupabase(
  slug: string,
): Promise<SavedArticle | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return withHeadshotOnSaved(rowToSaved(data as ArticleRow));
}

export async function saveArticleServer(article: SavedArticle): Promise<void> {
  requirePersistentStorage();
  if (isSupabaseConfigured()) {
    await saveArticleSupabase(article);
    return;
  }
  await saveArticleFile(article);
}

export async function listArticlesByUserServer(
  userId: string,
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, article_json, mode, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const json = row.article_json as SavedArticle["articleJson"];
    return {
      id: row.id as string,
      slug: row.slug as string,
      title: json.title,
      mode: row.mode as SavedArticle["mode"],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  });
}

export async function getArticleBySlugServer(
  slug: string,
): Promise<SavedArticle | null> {
  if (slug === EXAMPLE_ARTICLE_SLUG) {
    return getExampleArticle();
  }
  if (isSupabaseConfigured()) {
    return getArticleBySlugSupabase(slug);
  }
  if (isVercelDeployment()) {
    return null;
  }
  return getArticleBySlugFile(slug);
}
