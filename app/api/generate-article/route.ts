import { NextResponse } from "next/server";
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

    const { intake, facts, headshotDataUrl, extraPhotoUrls } = parsed.data;
    const supplementalPhotos = (extraPhotoUrls ?? []).map((dataUrl) => ({
      dataUrl,
    }));

    log.push(
      `mode=${intake.mode}, length=${intake.articleLength}, tone=${intake.tone}`,
    );
    log.push(
      `headshot=${headshotDataUrl ? `${Math.round(headshotDataUrl.length / 1024)}KB` : "none"}, extraPhotos=${supplementalPhotos.length}`,
    );
    log.push(`hasAiKey=${hasAiKey()}`);

    const t0 = Date.now();
    const article = await generateArticle(
      intake,
      facts ?? emptyExtractedFacts(),
      headshotDataUrl ?? "",
      supplementalPhotos,
    );
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
