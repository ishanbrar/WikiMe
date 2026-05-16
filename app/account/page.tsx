import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/appUrl";
import { listArticlesByUserServer } from "@/lib/articleStore";
import { getAuthUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
export default async function AccountPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const appBase = getAppBaseUrl();
  let articles: Awaited<ReturnType<typeof listArticlesByUserServer>> = [];
  let loadError: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      articles = await listArticlesByUserServer(user.id);
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Could not load articles";
    }
  } else {
    loadError = "Supabase is not configured on the server.";
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <h1>My articles</h1>
        <p className="account-email">{user.email}</p>
        <Link href="/generate" className="btn-primary account-new">
          Create new article
        </Link>
      </header>

      {loadError && (
        <p className="account-error" role="alert">
          {loadError}
        </p>
      )}

      {!loadError && articles.length === 0 && (
        <div className="account-empty">
          <p>You have not saved any articles yet.</p>
          <p className="account-empty-hint">
            Generate an article while signed in — it will appear here with a permanent link.
          </p>
          <Link href="/generate" className="auth-link">
            Start your first article
          </Link>
        </div>
      )}

      {articles.length > 0 && (
        <ul className="account-list">
          {articles.map((a) => (
            <li key={a.id} className="account-list-item">
              <div>
                <Link href={`/a/${a.slug}`} className="account-list-title">
                  {a.title}
                </Link>
                <p className="account-list-meta">
                  {a.mode === "creative" ? "Creative" : "Realism"} · Updated{" "}
                  {new Date(a.updatedAt).toLocaleDateString()}
                </p>
                <p className="account-list-url">
                  {appBase}/a/{a.slug}
                </p>
              </div>
              <Link href={`/article?slug=${a.slug}`} className="btn-secondary account-edit">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
