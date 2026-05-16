import Link from "next/link";
import { getArticleBySlugServer } from "@/lib/articleStore";
import { SharedArticleView } from "@/components/SharedArticleView";

export default async function SharedArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const saved = await getArticleBySlugServer(slug);

  if (!saved) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-xl font-semibold">Article not found</h1>
        <p className="mt-2 text-slate-600">
          This share link may have expired or the server was restarted (file-based storage).
        </p>
        <Link href="/" className="text-blue-600 mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  return <SharedArticleView saved={saved} readOnly />;
}
