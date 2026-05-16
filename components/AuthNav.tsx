"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true);
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (!isSupabaseBrowserConfigured()) {
    return (
      <Link href="/signup" className="site-header-cta">
        Sign up
      </Link>
    );
  }

  if (user) {
    return (
      <div className="site-header-auth">
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
