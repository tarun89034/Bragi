"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export default function AuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (next: AuthMode) => void;
}) {
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setErrorMsg(null);
      setInfoMsg(null);
      setLoading(false);
    }
  }, [open, mode]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!supabase) {
      setErrorMsg("Authentication is not configured.");
      return;
    }
    if (!email || !password) {
      setErrorMsg("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setInfoMsg(
          "Signup successful. Please check your email to confirm your account before signing in."
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown authentication error";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <h2
            id="auth-modal-title"
            className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
          >
            {mode === "signin" ? "Sign in to Bragi" : "Create your Bragi account"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="Your password"
            />
          </div>

          {errorMsg ? (
            <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
          ) : null}
          {infoMsg ? (
            <p className="text-xs text-green-700 dark:text-green-500">{infoMsg}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>

          <div className="text-center text-xs text-neutral-600 dark:text-neutral-300">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => onModeChange("signup")}
                >
                  Create one
                </button>
                .
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => onModeChange("signin")}
                >
                  Sign in
                </button>
                .
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
