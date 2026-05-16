import { promises as fs } from "fs";
import path from "path";
import type { SavedArticle } from "@/types/article";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

const DATA_DIR = path.join(process.cwd(), "data", "articles");

type ArticleRow = {
  id: string;
  slug: string;
  article_json: SavedArticle["articleJson"];
  mode: SavedArticle["mode"];
  intake: SavedArticle["intake"];
  headshot_data_url: string | null;
  extracted_facts: SavedArticle["extractedFacts"] | null;
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
    return JSON.parse(raw) as SavedArticle;
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
  return rowToSaved(data as ArticleRow);
}

export async function saveArticleServer(article: SavedArticle): Promise<void> {
  if (isSupabaseConfigured()) {
    await saveArticleSupabase(article);
    return;
  }
  await saveArticleFile(article);
}

export async function getArticleBySlugServer(
  slug: string,
): Promise<SavedArticle | null> {
  if (isSupabaseConfigured()) {
    try {
      return await getArticleBySlugSupabase(slug);
    } catch {
      return getArticleBySlugFile(slug);
    }
  }
  return getArticleBySlugFile(slug);
}
