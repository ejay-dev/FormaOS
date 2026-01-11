"use client";

import React, { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<string | undefined>(undefined);
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("plan") ?? undefined;
      setPlan(p);
    } catch (e) {
      setPlan(undefined);
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const base = (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage("Please provide email and password.");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      const redirectTo = plan ? `${base}/auth/callback?plan=${encodeURIComponent(plan)}` : `${base}/auth/callback`;
      const options = { emailRedirectTo: redirectTo } as any;
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) {
        setErrorMessage(error.message ?? "Sign up failed.");
        setIsLoading(false);
        return;
      }

      const hasSession = Boolean(data?.user);
      if (hasSession) {
        router.push("/auth/plan-select");
      } else {
        router.push("/auth/plan-select");
      }
    } catch (err) {
      setErrorMessage("Unexpected error. Please try again.");
      setIsLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      const redirectTo = plan ? `${base}/auth/callback?plan=${encodeURIComponent(plan)}` : `${base}/auth/callback`;
      console.log("[signup] Starting Google OAuth", { redirectTo });
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) {
        setErrorMessage(error.message ?? "OAuth failed.");
        setIsLoading(false);
        return;
      }
      if (data?.url) {
        console.log("[signup] OAuth redirect URL (from Supabase):", data.url);
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMessage("Unexpected error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-10">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-slate-400 mt-2">Sign up with email or Google.</p>

        {errorMessage && <div className="mt-4 text-sm text-rose-300">{errorMessage}</div>}

        <form onSubmit={handleSignUp} className="mt-6 space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100" required minLength={8} />
          <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100" required />
          <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950">{isLoading ? "Creating..." : "Create account"}</button>
        </form>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-slate-500">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <button onClick={signUpWithGoogle} disabled={isLoading} className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100">Continue with Google</button>

        <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <a href="/auth/signin" className="font-semibold text-sky-400">Sign in</a></p>
      </div>
    </div>
  );
}
