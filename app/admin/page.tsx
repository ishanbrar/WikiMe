import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin";
import { listAdminArticleLog } from "@/lib/adminArticles";
import { getAuthUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

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
  let loadError: string | null = null;

  try {
    articles = await listAdminArticleLog();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load article log";
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Article log</h1>
          <p className="admin-muted">
            Signed in as {user.email}. All articles saved to the server (
            {articles.length} shown, newest first).
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

      {loadError && (
        <p className="account-error" role="alert">
          {loadError}
        </p>
      )}

      {!loadError && articles.length === 0 && (
        <p className="admin-muted">No articles have been saved yet.</p>
      )}

      {articles.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Article title</th>
                <th scope="col">Account</th>
                <th scope="col">Mode</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={row.articleUrl}
                      className="admin-table-title"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td>
                    {row.creatorEmail ? (
                      row.creatorEmail
                    ) : (
                      <span className="admin-guest">Guest (not signed in)</span>
                    )}
                  </td>
                  <td className="admin-mode">
                    {row.mode === "creative" ? "Creative" : "Realism"}
                  </td>
                  <td className="admin-when">{formatWhen(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
