import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { ADMIN_TEST_HEADER } from "@/lib/adminConstants";
import { getAuthUser } from "@/lib/supabase/server";

export { ADMIN_TEST_HEADER } from "@/lib/adminConstants";

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
