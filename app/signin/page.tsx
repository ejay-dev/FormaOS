"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setErrorMessage(null);
    // Prefer runtime app URL (deployed) when available to ensure callback goes to app host
    let base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    try {
      const res = await fetch("/api/debug/env");
      const json = await res.json();
      if (json?.env?.appUrl) base = json.env.appUrl.replace(/\/$/, "");
    } catch {
      /* silent fallback */
    }

    if (!base) base = (window.location.origin ?? "").replace(/\/$/, "");

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${base}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "An unexpected error occurred.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message ?? "Invalid email or password.");
      setIsLoading(false);
      return;
    }

    // Redirect will be handled by middleware
    // Redirect to app host using runtime app URL if available
    try {
      const res = await fetch("/api/debug/env");
      const json = await res.json();
      const runtimeBase = json?.env?.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      window.location.href = `${String(runtimeBase).replace(/\/$/, "")}/app`;
    } catch {
      const fallback = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
      window.location.href = `${fallback}/app`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your FormaOS account</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Email/Password Sign In Form */}
        <form onSubmit={signInWithEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-slate-500">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
