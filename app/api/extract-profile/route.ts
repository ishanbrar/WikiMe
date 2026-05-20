import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractProfileFactsFromScreenshots,
  mergeExtractedFacts,
  emptyExtractedFacts,
} from "@/lib/extractProfileFacts";
import { adminJsonError, isAdminTestRequest } from "@/lib/adminApiDebug";
import { hasAiKey } from "@/lib/gemini";

const bodySchema = z.object({
  screenshots: z.array(z.string().max(500_000)).max(6),
});

export async function POST(req: Request) {
  const adminDebug = await isAdminTestRequest(req);
  const log: string[] = [];

  try {
    const body = await req.json();
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

    const { screenshots } = parsed.data;
    if (!screenshots.length) {
      return NextResponse.json({
        facts: emptyExtractedFacts(),
        mock: !hasAiKey(),
        ...(adminDebug ? { adminLog: ["No screenshots in request"] } : {}),
      });
    }

    log.push(`screenshotCount=${screenshots.length}, hasAiKey=${hasAiKey()}`);

    let merged = emptyExtractedFacts();
    for (let i = 0; i < screenshots.length; i++) {
      const t0 = Date.now();
      log.push(`extract screenshot ${i + 1}: payload ~${Math.round(screenshots[i].length / 1024)}KB`);
      const batch = await extractProfileFactsFromScreenshots([screenshots[i]]);
      merged = mergeExtractedFacts(merged, batch);
      log.push(`screenshot ${i + 1} done in ${Date.now() - t0}ms`);
    }

    return NextResponse.json({
      facts: merged,
      mock: !hasAiKey(),
      ...(adminDebug ? { adminLog: log } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed";
    log.push(`Error: ${message}`);
    if (e instanceof Error && e.stack) log.push(e.stack);

    if (adminDebug) {
      return adminJsonError(500, message, log);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
