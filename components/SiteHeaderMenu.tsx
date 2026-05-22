"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { MenuIcon } from "@/components/icons/ArticleToolbarIcons";
import { IconButton } from "@/components/IconButton";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function SiteHeaderMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true);
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
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    if (!isSupabaseBrowserConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  if (!ready) {
    return <span className="site-header-auth-placeholder" aria-hidden />;
  }

  return (
    <div className="site-header-menu" ref={menuRef}>
      <IconButton
        label="Site menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="site-header-menu-trigger"
      >
        <MenuIcon />
      </IconButton>
      {open && (
        <div className="site-header-menu-dropdown" role="menu">
          <Link
            href="/generate"
            role="menuitem"
            className="site-header-menu-item site-header-menu-item--cta"
            onClick={() => setOpen(false)}
          >
            Create article
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="site-header-menu-item"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                role="menuitem"
                className="site-header-menu-item"
                onClick={() => setOpen(false)}
              >
                My articles
              </Link>
              <button
                type="button"
                role="menuitem"
                className="site-header-menu-item"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signup"
              role="menuitem"
              className="site-header-menu-item"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
