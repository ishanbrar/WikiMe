import { NextResponse } from "next/server";
import { listAdminArticleLog } from "@/lib/adminArticles";
import { isAdminUser } from "@/lib/admin";
import { getAuthUser } from "@/lib/supabase/server";

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
