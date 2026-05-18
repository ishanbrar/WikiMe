import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppBaseUrl } from "@/lib/appUrl";
import { requireAdminUser } from "@/lib/admin";
import { renameArticleSlugByIdServer } from "@/lib/articleStore";
import { getAuthUser } from "@/lib/supabase/server";

const bodySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
});

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser();
    requireAdminUser(user);

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const article = await renameArticleSlugByIdServer(
      parsed.data.id,
      parsed.data.slug,
    );
    const base = getAppBaseUrl(req);
    return NextResponse.json({
      slug: article.slug,
      url: `${base}/a/${article.slug}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status =
      message === "Forbidden"
        ? 403
        : message === "Article not found"
          ? 404
          : message === "That link is already in use" ||
              message.includes("reserved") ||
              message.includes("Slug")
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
