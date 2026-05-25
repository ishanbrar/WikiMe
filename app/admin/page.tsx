import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin";
import { listAdminArticleLog } from "@/lib/adminArticles";
import { getAuthUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { AdminArticleTable } from "@/components/AdminArticleTable";
import { AdminGenerationRuns } from "@/components/AdminGenerationRuns";
import { listAdminGenerationRuns } from "@/lib/adminGenerationRuns";

export default async function AdminPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!isAdminUser(user)) {
    return (
      <main className="admin-page">
        <h1>Access denied</h1>
        <p className="admin-muted">
          This page is limited to WikiMe administrators.
        </p>
        <Link href="/" className="auth-link">
          Go home
        </Link>
      </main>
    );
  }

  let articles: Awaited<ReturnType<typeof listAdminArticleLog>> = [];
  let generationRuns: Awaited<ReturnType<typeof listAdminGenerationRuns>> = [];
  let articlesError: string | null = null;
  let generationRunsError: string | null = null;

  try {
    articles = await listAdminArticleLog();
  } catch (e) {
    articlesError = e instanceof Error ? e.message : "Could not load article log";
  }

  try {
    generationRuns = await listAdminGenerationRuns(50);
  } catch (e) {
    generationRunsError =
      e instanceof Error ? e.message : "Could not load generation runs";
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Article log</h1>
          <p className="admin-muted">
            Signed in as {user.email}. {articles.length} articles (newest first).
            Admins can edit any article or set a custom link (e.g. /ishanbrar) below.
          </p>
        </div>
        <Link href="/generate" className="btn-secondary">
          Create article
        </Link>
      </header>

      {!isSupabaseConfigured() && (
        <p className="admin-warn" role="status">
          Supabase is not configured — showing local file storage only (if any).
        </p>
      )}

      {articlesError && (
        <p className="account-error" role="alert">
          {articlesError}
        </p>
      )}

      <section className="admin-section">
        <h2 className="admin-section-title">Generation runs</h2>
        <p className="admin-muted">
          Detailed logs from /generate while signed in as admin.
        </p>
        {generationRunsError ? (
          <p className="admin-warn" role="alert">
            {generationRunsError}
          </p>
        ) : (
          <AdminGenerationRuns runs={generationRuns} />
        )}
      </section>

      {!articlesError && articles.length === 0 && (
        <p className="admin-muted">No articles have been saved yet.</p>
      )}

      {articles.length > 0 && (
        <AdminArticleTable articles={articles} />
      )}
    </main>
  );
}
