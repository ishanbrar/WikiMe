import type { Metadata } from "next";
import { Suspense } from "react";
import { EncodedShareClient } from "@/components/EncodedShareClient";
import { articleShareMetadata } from "@/lib/articleShareMetadata";
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
  return articleShareMetadata(
    decoded.articleJson.title,
    decoded.articleJson.subtitle,
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
