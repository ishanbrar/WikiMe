import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminUser } from "@/lib/admin";
import { listAdminGenerationRuns, saveAdminGenerationRun } from "@/lib/adminGenerationRuns";
import { getAuthUser } from "@/lib/supabase/server";

const postSchema = z.object({
  id: z.string().optional(),
  mode: z.string(),
  success: z.boolean(),
  errorMessage: z.string().optional().nullable(),
  logs: z.array(
    z.object({
      at: z.string(),
      level: z.enum(["info", "warn", "error"]),
      message: z.string(),
      stepId: z.string().optional(),
    }),
  ),
  steps: z.array(z.record(z.string(), z.unknown())).optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const runs = await listAdminGenerationRuns(50);
    return NextResponse.json({ runs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load runs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const id = await saveAdminGenerationRun({
      ...parsed.data,
      userEmail: user.email ?? null,
      steps: parsed.data.steps as import("@/lib/generationRun").GenerationRunStep[] | undefined,
    });

    return NextResponse.json({ id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
