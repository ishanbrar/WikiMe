import { redirect } from "next/navigation";
import { getArticleBySlugServer } from "@/lib/articleStore";
import { articlePath } from "@/lib/articlePaths";
import { sharedArticleMetadata, SharedArticlePageBody } from "@/lib/sharedArticlePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return sharedArticleMetadata(slug);
}

export default async function SharedArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const saved = await getArticleBySlugServer(slug);

  if (saved?.shortLink) {
    redirect(articlePath(slug, true));
  }

  return <SharedArticlePageBody slug={slug} />;
}
