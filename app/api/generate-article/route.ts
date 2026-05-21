import { NextResponse } from "next/server";

/** Vercel Pro allows up to 300s; keeps multi-step realism from dying at default 10–60s. */
export const maxDuration = 300;
import { z } from "zod";
import { generateArticle } from "@/lib/generateArticle";
import {
  articleImageMetrics,
  formatArticleImageMetrics,
} from "@/lib/articleImages";
import { enrichFactsWithIntake } from "@/lib/enrichFactsWithIntake";
import { articleWordCount } from "@/lib/normalizeArticle";
import { adminJsonError, isAdminTestRequest } from "@/lib/adminApiDebug";
import { formatUnknownError } from "@/lib/formatError";
import { hasAiKey } from "@/lib/gemini";
import { intakeSchema, factsInputSchema } from "@/lib/validation";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";
import { withTransientRetry } from "@/lib/transientRetry";

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

    const factsEnriched = enrichFactsWithIntake(
      facts ?? emptyExtractedFacts(),
      intake,
    );
    log.push(
      `facts: education=${factsEnriched.education.length}, work=${factsEnriched.work.length}, rawText=${factsEnriched.rawUsefulText.length}`,
    );

    const t0 = Date.now();
    const article = await withTransientRetry(
      () =>
        Promise.race([
          generateArticle(
            intake,
            factsEnriched,
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
        ]),
      { maxAttempts: 2, baseDelayMs: 2000, label: "generateArticleRoute" },
    );
    log.push(`generateArticle() finished in ${Date.now() - t0}ms`);
    log.push(`articleWordCount=${articleWordCount(article)}`);
    log.push(`summaryLeadParagraphs=${article.summaryLead.length}`);
    log.push(`sectionIds=${article.sections.map((s) => s.id).join(",") || "(none)"}`);
    const img = articleImageMetrics(article, headshotDataUrl);
    log.push(`images: ${formatArticleImageMetrics(img)}`);
    if (supplementalPhotos.length && img.figuresWithDataUrl < supplementalPhotos.length) {
      log.push(
        `warn: expected up to ${supplementalPhotos.length} inline figure(s), got ${img.figuresWithDataUrl}`,
      );
    }
    if (headshotDataUrl && !img.infoboxHasImage) {
      log.push("warn: headshot was sent but infobox has no image after normalize");
    }

    return NextResponse.json({
      article,
      mock: !hasAiKey(),
      ...(adminDebug ? { adminLog: log } : {}),
    });
  } catch (e) {
    const message = formatUnknownError(e);
    log.push(`Error: ${message}`);
    if (e instanceof Error && e.stack) log.push(e.stack);

    if (adminDebug) {
      return adminJsonError(500, message, log);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
