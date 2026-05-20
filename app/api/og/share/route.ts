import { getAppBaseUrl } from "@/lib/appUrl";
import {
  articleHasSharePreviewImage,
  headshotImageResponse,
} from "@/lib/headshotOgImage";
import { decodeArticleFromUrl } from "@/lib/share";

export const runtime = "nodejs";

/** Max encoded payload length for og:image URLs (platform URL limits). */
const MAX_OG_QUERY_LENGTH = 6000;

export async function GET(request: Request) {
  const d = new URL(request.url).searchParams.get("d");
  if (!d || d.length > MAX_OG_QUERY_LENGTH) {
    return new Response("Invalid share payload", { status: 400 });
  }

  const decoded = decodeArticleFromUrl(d);
  const headshot = decoded?.headshotDataUrl?.trim() ?? "";
  if (!articleHasSharePreviewImage(headshot)) {
    return new Response("No preview image", { status: 404 });
  }

  const baseUrl = getAppBaseUrl(request);
  const response = headshotImageResponse(headshot, baseUrl);
  if (!response) {
    return new Response("Unsupported image", { status: 404 });
  }

  return response;
}
