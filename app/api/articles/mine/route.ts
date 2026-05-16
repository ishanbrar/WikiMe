import { NextResponse } from "next/server";
import { listArticlesByUserServer } from "@/lib/articleStore";
import { getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const articles = await listArticlesByUserServer(user.id);
    return NextResponse.json({ articles });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
