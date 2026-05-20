import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { getAuthUser } from "@/lib/supabase/server";

export const ADMIN_TEST_HEADER = "x-wikime-admin-test";

export async function isAdminTestRequest(req: Request): Promise<boolean> {
  if (req.headers.get(ADMIN_TEST_HEADER) !== "1") return false;
  const user = await getAuthUser();
  return isAdminUser(user);
}

export function adminJsonError(
  status: number,
  message: string,
  log: string[],
  extra?: Record<string, unknown>,
) {
  console.error("[WikiMe admin]", message, log);
  return NextResponse.json(
    { error: message, adminLog: log, ...extra },
    { status },
  );
}
