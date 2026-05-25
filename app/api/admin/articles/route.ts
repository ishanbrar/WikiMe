import { NextResponse } from "next/server";
import { z } from "zod";
import { listAdminArticleLog } from "@/lib/adminArticles";
import { isAdminUser } from "@/lib/admin";
import { deleteArticleByIdServer } from "@/lib/articleStore";
import { getAuthUser } from "@/lib/supabase/server";

const deleteBodySchema = z.object({
  id: z.string().min(1),
});

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const articles = await listAdminArticleLog(req);
    return NextResponse.json({ articles });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = deleteBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await deleteArticleByIdServer(parsed.data.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete article";
    const status = message === "Article not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
