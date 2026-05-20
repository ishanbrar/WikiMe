import { getArticleBySlugServer } from "@/lib/articleStore";
import { getExampleArticleBySlug } from "@/lib/exampleArticle";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  articleHasSharePreviewImage,
  headshotImageResponse,
  resolveArticleHeadshotUrl,
} from "@/lib/headshotOgImage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const baseUrl = getAppBaseUrl(request);

  const saved =
    (await getArticleBySlugServer(slug)) ??
    getExampleArticleBySlug(slug) ??
    null;

  if (!saved) {
    return new Response("Not found", { status: 404 });
  }

  const headshot = resolveArticleHeadshotUrl(saved);
  if (!articleHasSharePreviewImage(headshot)) {
    return new Response("No preview image", { status: 404 });
  }

  const response = headshotImageResponse(headshot, baseUrl);
  if (!response) {
    return new Response("Unsupported image", { status: 404 });
  }

  return response;
}
