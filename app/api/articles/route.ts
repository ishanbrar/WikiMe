import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { buildArticleUrl } from "@/lib/articlePaths";
import { getAppBaseUrl } from "@/lib/appUrl";
import { canEditArticle } from "@/lib/articleAccess";
import {
  saveArticleServer,
  getArticleByIdServer,
  getArticleBySlugServer,
} from "@/lib/articleStore";
import { isAdminUser } from "@/lib/admin";
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
    let existing = slug ? await getArticleBySlugServer(slug) : null;
    if (!existing && parsed.data.id) {
      existing = await getArticleByIdServer(parsed.data.id);
    }

    if (existing && !canEditArticle(user, existing)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminEditingOther =
      Boolean(
        existing?.userId &&
          user &&
          isAdminUser(user) &&
          existing.userId !== user.id,
      );

    const saved: SavedArticle = await prepareArticleForDb({
      id: parsed.data.id ?? existing?.id ?? nanoid(),
      slug,
      articleJson: parsed.data.articleJson,
      mode: parsed.data.mode,
      intake: parsed.data.intake,
      headshotDataUrl: parsed.data.headshotDataUrl,
      userId: adminEditingOther
        ? existing!.userId
        : (existing?.userId ?? user?.id),
      creatorEmail: adminEditingOther
        ? existing!.creatorEmail
        : (existing?.creatorEmail ?? user?.email ?? undefined),
      isPublic: true,
      shortLink: existing?.shortLink ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    await saveArticleServer(saved);
    return NextResponse.json({
      slug,
      id: saved.id,
      shortLink: saved.shortLink ?? false,
      url: buildArticleUrl(slug, saved.shortLink ?? false, getAppBaseUrl(req)),
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
