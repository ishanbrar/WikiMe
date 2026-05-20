import { NextResponse } from "next/server";

/** Vercel Pro allows up to 300s; keeps multi-step realism from dying at default 10–60s. */
export const maxDuration = 300;
import { z } from "zod";
import { generateArticle } from "@/lib/generateArticle";
import { articleWordCount } from "@/lib/normalizeArticle";
import { adminJsonError, isAdminTestRequest } from "@/lib/adminApiDebug";
import { hasAiKey } from "@/lib/gemini";
import { intakeSchema, factsInputSchema } from "@/lib/validation";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";

const bodySchema = z.object({
  intake: intakeSchema,
  facts: factsInputSchema.optional(),
  headshotDataUrl: z.string().max(500_000).optional(),
  extraPhotoUrls: z.array(z.string().max(500_000)).max(2).optional(),
  extraPhotos: z
    .array(
      z.object({
        dataUrl: z.string().max(500_000),
        description: z.string().max(400).optional(),
      }),
    )
    .max(2)
    .optional(),
});

export async function POST(req: Request) {
  const adminDebug = await isAdminTestRequest(req);
  const log: string[] = [];

  try {
    const body = await req.json();
    log.push("Parsed request body");

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      log.push(`Validation failed: ${JSON.stringify(parsed.error.flatten())}`);
      if (adminDebug) {
        return adminJsonError(400, "Invalid request", log, {
          details: parsed.error.flatten(),
        });
      }
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { intake, facts, headshotDataUrl, extraPhotoUrls, extraPhotos } =
      parsed.data;
    const supplementalPhotos =
      extraPhotos?.map((p) => ({
        dataUrl: p.dataUrl,
        description: p.description?.trim() || undefined,
      })) ??
      (extraPhotoUrls ?? []).map((dataUrl) => ({ dataUrl }));

    log.push(
      `mode=${intake.mode}, length=${intake.articleLength}, tone=${intake.tone}`,
    );
    log.push(
      `headshot=${headshotDataUrl ? `${Math.round(headshotDataUrl.length / 1024)}KB` : "none"}, extraPhotos=${supplementalPhotos.length}`,
    );
    log.push(`hasAiKey=${hasAiKey()}`);

    const t0 = Date.now();
    const article = await Promise.race([
      generateArticle(
        intake,
        facts ?? emptyExtractedFacts(),
        headshotDataUrl ?? "",
        supplementalPhotos,
      ),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Article generation timed out on the server. Try a shorter article length or fewer images.",
              ),
            ),
          285_000,
        );
      }),
    ]);
    log.push(`generateArticle() finished in ${Date.now() - t0}ms`);
    log.push(`articleWordCount=${articleWordCount(article)}`);

    return NextResponse.json({
      article,
      mock: !hasAiKey(),
      ...(adminDebug ? { adminLog: log } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    log.push(`Error: ${message}`);
    if (e instanceof Error && e.stack) log.push(e.stack);

    if (adminDebug) {
      return adminJsonError(500, message, log);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
