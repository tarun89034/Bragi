"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

type UserSummary = {
  id: string;
  email: string | null;
};

export default function LandingHeader() {
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const [navOpen, setNavOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<UserSummary | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function loadUser() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null });
      } else {
        setUser(null);
      }
    }
    loadUser();

    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user
          ? { id: session.user.id, email: session.user.email ?? null }
          : null;
        setUser(u);
        if (u) {
          setAuthOpen(false);
        }
      });
      unsub = () => {
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      if (unsub) unsub();
    };
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMenuOpen(false);
  }

  const userInitial = user?.email?.trim()?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-neutral-50/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:hidden dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:ring-neutral-600"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {navOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
              aria-label="Bragi home"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
                ♫
              </span>
              <span className="text-xl">Bragi</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/" className="text-sm hover:text-neutral-700 dark:hover:text-neutral-300">
              Home
            </Link>
            <Link href="/explore" className="text-sm hover:text-neutral-700 dark:hover:text-neutral-300">
              Explore
            </Link>
            <Link href="/charts" className="text-sm hover:text-neutral-700 dark:hover:text-neutral-300">
              Charts
            </Link>
            <Link href="/library" className="text-sm hover:text-neutral-700 dark:hover:text-neutral-300">
              Library
            </Link>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded border border-neutral-300 px-2 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="User menu"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {userInitial}
                  </span>
                  <span className="max-w-[160px] truncate text-neutral-800 dark:text-neutral-200">
                    {user.email ?? "Account"}
                  </span>
                  <svg
                    className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <Link
                      href="/library"
                      className="block px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Library
                    </Link>
                    <Link
                      href="/upload"
                      className="block px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Uploads
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-neutral-50 dark:text-red-400 dark:hover:bg-neutral-700"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthOpen(true);
                  }}
                  className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthOpen(true);
                  }}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>

        {navOpen ? (
          <div className="border-t border-neutral-200/60 px-4 pb-4 sm:hidden dark:border-neutral-800">
            <nav className="grid gap-2 py-2">
              <Link href="/" className="rounded px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Home
              </Link>
              <Link href="/explore" className="rounded px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Explore
              </Link>
              <Link href="/charts" className="rounded px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Charts
              </Link>
              <Link href="/library" className="rounded px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Library
              </Link>

              {user ? (
                <div className="mt-2 grid gap-2">
                  <Link
                    href="/upload"
                    className="rounded border border-neutral-300 px-3 py-2 text-center text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    onClick={() => setNavOpen(false)}
                  >
                    Uploads
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleSignOut();
                      setNavOpen(false);
                    }}
                    className="rounded border border-neutral-300 px-3 py-2 text-center text-sm text-red-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-neutral-800"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthOpen(true);
                      setNavOpen(false);
                    }}
                    className="rounded border border-neutral-300 px-3 py-2 text-center text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthOpen(true);
                      setNavOpen(false);
                    }}
                    className="rounded bg-blue-600 px-3 py-2 text-center text-sm text-white hover:bg-blue-700"
                  >
                    Create account
                  </button>
                </div>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={(m) => setAuthMode(m)}
      />
    </>
  );
}
