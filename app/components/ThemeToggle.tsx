"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved =
      (typeof window !== "undefined" &&
        (localStorage.getItem("bragi_theme") as Theme | null)) || null;
    const initial = saved ?? "light";
    setTheme(initial);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", initial === "dark");
    }
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("bragi_theme", next);
    } catch {
      // ignore storage errors
    }
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center justify-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M21.64 13a9 9 0 01-11.64 8.65A9 9 0 1011.64 2a7 7 0 0010 11z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10h3v-2h-3v2zM17.24 4.84l1.8-1.79 1.79 1.79-1.79 1.8-1.8-1.8zM12 6a6 6 0 110 12 6 6 0 010-12zM4.84 17.24l-1.67 1.67 1.67 1.67 1.67-1.67-1.67-1.67zm14.32 0l1.67 1.67-1.67 1.67-1.67-1.67 1.67-1.67z" />
        </svg>
      )}
    </button>
  );
}
