"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PLAN_CATALOG, resolvePlanKey } from "@/lib/plans";

function SignUpContent() {
  const searchParams = useSearchParams();
  const planParam = resolvePlanKey(searchParams.get("plan"));
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");

  const plan = useMemo(() => (planParam ? PLAN_CATALOG[planParam] : null), [planParam]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const signUpWithGoogle = async () => {
    const base =
      (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
    const redirectTo = plan
      ? `${base}/auth/callback?plan=${encodeURIComponent(plan.key)}`
      : `${base}/auth/callback`;

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const signUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const base =
        (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
      const redirectTo = plan
        ? `${base}/auth/callback?plan=${encodeURIComponent(plan.key)}`
        : `${base}/auth/callback`;
      const options = plan
        ? { emailRedirectTo: redirectTo, data: { selected_plan: plan.key } }
        : { emailRedirectTo: redirectTo };

      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setSuccessMessage("Please check your email to confirm your account before signing in.");
          setIsLoading(false);
        } else {
          window.location.href = redirectTo;
        }
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-10">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {plan ? "Plan selected" : "Get started"}
        </div>
        <h1 className="mt-3 text-3xl font-semibold">
          {plan ? plan.name : "Create your FormaOS account"}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          {plan
            ? plan.summary
            : "Sign up with email or Google. You can choose a plan right after signup."}
        </p>
        {plan ? (
          <>
            {plan.key !== "enterprise" ? (
              <p className="mt-2 text-xs text-slate-400">
                14-day free trial. No payment details required at signup.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Enterprise onboarding is sales-led. We will confirm pricing and rollout after signup.
              </p>
            )}
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              {plan.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#05080f] p-4 text-xs text-slate-400">
            Want to compare plans first?{" "}
            <button
              onClick={() => window.location.assign(`${siteBase}/pricing`)}
              className="font-semibold text-sky-300 hover:text-sky-200 transition-colors"
            >
              View plans
            </button>
            .
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={signUpWithEmail} className="mt-8 space-y-4">
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
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-400 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
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
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-slate-500">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <button
          onClick={signUpWithGoogle}
          disabled={isLoading}
          className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>

        {plan ? (
          <button
            onClick={() => window.location.assign(`${siteBase}/pricing`)}
            disabled={isLoading}
            className="mt-4 w-full rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Change plan
          </button>
        ) : null}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <a
            href="/auth/signin"
            className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
            Loading signup...
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
