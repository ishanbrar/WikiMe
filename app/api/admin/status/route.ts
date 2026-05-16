import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  return NextResponse.json({ isAdmin: isAdminUser(user) });
}
