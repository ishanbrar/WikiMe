import { sharedArticleMetadata, SharedArticlePageBody } from "@/lib/sharedArticlePage";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return sharedArticleMetadata(slug);
}

export default async function RootSlugArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SharedArticlePageBody slug={slug} requireShortLink />;
}
