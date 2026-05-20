"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;

    const supabase = createClient();

    const check = (hasUser: boolean) => {
      if (!hasUser) {
        setIsAdmin(false);
        return;
      }
      fetch("/api/admin/status")
        .then((r) => r.json())
        .then((body: { isAdmin?: boolean }) => setIsAdmin(Boolean(body.isAdmin)))
        .catch(() => setIsAdmin(false));
    };

    supabase.auth.getUser().then(({ data }) => check(Boolean(data.user)));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      check(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return isAdmin;
}
