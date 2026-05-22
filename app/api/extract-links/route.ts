import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichFactsWithIntake } from "@/lib/enrichFactsWithIntake";
import { emptyExtractedFacts } from "@/lib/extractProfileFacts";
import { enrichFactsWithLinks } from "@/lib/linkExtraction";
import { intakeSchema, factsInputSchema } from "@/lib/validation";

export const maxDuration = 60;

const bodySchema = z.object({
  intake: intakeSchema,
  facts: factsInputSchema.optional(),
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

    const baseFacts = enrichFactsWithIntake(
      parsed.data.facts ?? emptyExtractedFacts(),
      parsed.data.intake,
    );
    const result = await enrichFactsWithLinks(baseFacts, parsed.data.intake);
    return NextResponse.json({
      facts: result.facts,
      statuses: result.statuses,
      logs: result.logs,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Link extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
