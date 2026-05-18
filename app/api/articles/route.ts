import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  saveArticleServer,
  getArticleBySlugServer,
} from "@/lib/articleStore";
import { validateArticleSlug } from "@/lib/articleSlug";
import { prepareArticleForDb } from "@/lib/prepareArticleForDb";
import { getAuthUser } from "@/lib/supabase/server";
import { articleJsonSchema, intakeSchema } from "@/lib/validation";
import type { SavedArticle } from "@/types/article";

const postSchema = z.object({
  articleJson: articleJsonSchema,
  mode: z.enum(["realism", "creative"]),
  intake: intakeSchema,
  headshotDataUrl: z.string().optional(),
  slug: z.string().optional(),
  id: z.string().optional(),
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

    const user = await getAuthUser();
    const now = new Date().toISOString();
    let slug = parsed.data.slug ?? nanoid(10);
    if (parsed.data.slug) {
      const checked = validateArticleSlug(parsed.data.slug);
      if (!checked.ok) {
        return NextResponse.json({ error: checked.error }, { status: 400 });
      }
      slug = checked.slug;
    }
    const existing = parsed.data.slug
      ? await getArticleBySlugServer(parsed.data.slug)
      : null;

    if (
      existing?.userId &&
      user &&
      existing.userId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const saved: SavedArticle = prepareArticleForDb({
      id: parsed.data.id ?? existing?.id ?? nanoid(),
      slug,
      articleJson: parsed.data.articleJson,
      mode: parsed.data.mode,
      intake: parsed.data.intake,
      headshotDataUrl: parsed.data.headshotDataUrl,
      userId: user?.id ?? existing?.userId,
      creatorEmail: user?.email ?? existing?.creatorEmail,
      isPublic: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    await saveArticleServer(saved);
    const base = getAppBaseUrl(req);
    return NextResponse.json({
      slug,
      id: saved.id,
      url: `${base}/a/${slug}`,
    });
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
