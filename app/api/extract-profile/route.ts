import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractProfileFactsFromScreenshots,
  mergeExtractedFacts,
  emptyExtractedFacts,
} from "@/lib/extractProfileFacts";
import { hasAiKey } from "@/lib/gemini";

const bodySchema = z.object({
  screenshots: z.array(z.string().max(700_000)).max(6),
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

    const { screenshots } = parsed.data;
    if (!screenshots.length) {
      return NextResponse.json({ facts: emptyExtractedFacts(), mock: !hasAiKey() });
    }

    let merged = emptyExtractedFacts();
    for (const shot of screenshots) {
      const batch = await extractProfileFactsFromScreenshots([shot]);
      merged = mergeExtractedFacts(merged, batch);
    }

    return NextResponse.json({
      facts: merged,
      mock: !hasAiKey(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
