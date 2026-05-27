"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function AuthNav() {
  const router = useRouter();
  const supabaseEnabled = isSupabaseBrowserConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseEnabled);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
      if (data.user) {
        fetch("/api/admin/status")
          .then((r) => r.json())
          .then((body: { isAdmin?: boolean }) => setIsAdmin(Boolean(body.isAdmin)))
          .catch(() => setIsAdmin(false));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      if (next) {
        fetch("/api/admin/status")
          .then((r) => r.json())
          .then((body: { isAdmin?: boolean }) => setIsAdmin(Boolean(body.isAdmin)))
          .catch(() => setIsAdmin(false));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseEnabled]);

  const signOut = async () => {
    if (!isSupabaseBrowserConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (!ready) {
    return <span className="site-header-auth-placeholder" aria-hidden />;
  }

  if (!supabaseEnabled) {
    return (
      <Link href="/signup" className="site-header-cta">
        Sign up
      </Link>
    );
  }

  if (user) {
    return (
      <div className="site-header-auth">
        {isAdmin && (
          <Link href="/admin" className="site-header-link">
            Admin
          </Link>
        )}
        <Link href="/account" className="site-header-link">
          My articles
        </Link>
        <button
          type="button"
          className="site-header-link site-header-btn"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link href="/signup" className="site-header-cta">
      Sign up
    </Link>
  );
}
