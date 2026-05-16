"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/LoadingButton";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const title = mode === "login" ? "Welcome back" : "Create your account";
  const subtitle =
    mode === "login"
      ? "Sign in to save articles and revisit them anytime."
      : "Save your Wikipedia-style articles to your WikiMe account.";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseBrowserConfigured()) {
      setError("Supabase is not configured. Add keys to .env.local.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (signUpError) throw signUpError;
        setMessage(
          "Check your email to confirm your account, or sign in if confirmation is disabled.",
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.push(nextPath.startsWith("/") ? nextPath : "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h1 className="auth-card-title">{title}</h1>
      <p className="auth-card-subtitle">{subtitle}</p>

      <form onSubmit={submit} className="auth-form">
        <label className="auth-label">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </label>
        <label className="auth-label">
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="auth-message">{message}</p>}

        <LoadingButton
          type="submit"
          className="btn-primary auth-submit"
          loading={busy}
          loadingLabel={mode === "login" ? "Signing in…" : "Creating account…"}
        >
          {mode === "login" ? "Sign in" : "Sign up"}
        </LoadingButton>
      </form>

      <p className="auth-switch">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="auth-link">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="auth-link">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
