import { NextResponse } from "next/server";
import { z } from "zod";
import { regenerateSection } from "@/lib/generateArticle";
import { hasAiKey } from "@/lib/gemini";
import { intakeSchema, factsInputSchema, articleJsonSchema } from "@/lib/validation";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";
import { enrichFactsWithIntake } from "@/lib/enrichFactsWithIntake";

const bodySchema = z.object({
  intake: intakeSchema,
  facts: factsInputSchema.optional(),
  article: articleJsonSchema,
  sectionId: z.string().min(1),
  headshotDataUrl: z.string().optional(),
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

    const { intake, facts, article, sectionId, headshotDataUrl } = parsed.data;
    const section = await regenerateSection(
      intake,
      enrichFactsWithIntake(facts ?? emptyExtractedFacts(), intake),
      article,
      sectionId,
      headshotDataUrl ?? "",
    );

    return NextResponse.json({
      section,
      mock: !hasAiKey(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
