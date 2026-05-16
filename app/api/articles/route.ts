import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { saveArticleServer, getArticleBySlugServer } from "@/lib/articleStore";
import { articleJsonSchema, intakeSchema } from "@/lib/validation";
import type { SavedArticle } from "@/types/article";

const postSchema = z.object({
  articleJson: articleJsonSchema,
  mode: z.enum(["realism", "creative"]),
  intake: intakeSchema,
  headshotDataUrl: z.string().optional(),
  slug: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const slug = parsed.data.slug ?? nanoid(10);
    const saved: SavedArticle = {
      id: nanoid(),
      slug,
      articleJson: parsed.data.articleJson,
      mode: parsed.data.mode,
      intake: parsed.data.intake,
      headshotDataUrl: parsed.data.headshotDataUrl,
      createdAt: now,
      updatedAt: now,
    };

    await saveArticleServer(saved);
    return NextResponse.json({ slug, id: saved.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const article = await getArticleBySlugServer(slug);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ article });
}
