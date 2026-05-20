import { NextResponse } from "next/server";
import { z } from "zod";
import { generateArticle } from "@/lib/generateArticle";
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
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { intake, facts, headshotDataUrl, extraPhotoUrls } = parsed.data;
    const supplementalPhotos = (extraPhotoUrls ?? []).map((dataUrl) => ({
      dataUrl,
    }));
    const article = await generateArticle(
      intake,
      facts ?? emptyExtractedFacts(),
      headshotDataUrl ?? "",
      supplementalPhotos,
    );

    return NextResponse.json({
      article,
      mock: !hasAiKey(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
