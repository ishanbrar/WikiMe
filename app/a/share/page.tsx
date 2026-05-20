import type { Metadata } from "next";
import { Suspense } from "react";
import { EncodedShareClient } from "@/components/EncodedShareClient";
import { articleShareMetadata } from "@/lib/articleShareMetadata";
import {
  articleHasSharePreviewImage,
  buildEncodedShareOgImageUrl,
} from "@/lib/headshotOgImage";
import { getAppBaseUrl } from "@/lib/appUrl";
import { decodeArticleFromUrl } from "@/lib/share";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { d } = await searchParams;
  if (!d) {
    return { title: "Shared article" };
  }
  const decoded = decodeArticleFromUrl(d);
  if (!decoded?.articleJson?.title) {
    return { title: "Shared article" };
  }
  const headshot = decoded.headshotDataUrl?.trim() || "";
  const baseUrl = getAppBaseUrl();
  let ogImageUrl: string | undefined;
  if (headshot.startsWith("http://") || headshot.startsWith("https://")) {
    ogImageUrl = headshot;
  } else if (articleHasSharePreviewImage(headshot)) {
    ogImageUrl = buildEncodedShareOgImageUrl(d, baseUrl);
  }

  return articleShareMetadata(
    decoded.articleJson.title,
    decoded.articleJson.subtitle,
    { ogImageUrl },
  );
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const encoded = d ?? null;

  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <EncodedShareClient encoded={encoded} />
    </Suspense>
  );
}
