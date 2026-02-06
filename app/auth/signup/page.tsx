'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { PLAN_CATALOG, resolvePlanKey } from '@/lib/plans';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

function SignUpContent() {
  const searchParams = useSearchParams();
  const planParam = resolvePlanKey(searchParams.get('plan'));
  const siteBase = (
    process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
  ).replace(/\/$/, '');

  const plan = useMemo(
    () => (planParam ? PLAN_CATALOG[planParam] : null),
    [planParam],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const signUpWithGoogle = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    const base = (
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    ).replace(/\/$/, '');
    const redirectTo = plan
      ? `${base}/auth/callback?plan=${encodeURIComponent(plan.key)}`
      : `${base}/auth/callback`;
    const supabase = createSupabaseClient();
    // Generate CSRF state
    const state = Math.random().toString(36).substring(2, 15);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { state } },
    });
    if (error) {
      setErrorMessage(error.message ?? 'An unexpected error occurred.');
      setIsLoading(false);
      console.error('Google OAuth error:', error);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setErrorMessage('No redirect URL returned from Google OAuth.');
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password || !confirmPassword) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const base = (
        process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      ).replace(/\/$/, '');
      const emailRedirectTo = `${base}/app/onboarding`;
      const options = plan
        ? { emailRedirectTo, data: { selected_plan: plan.key } }
        : { emailRedirectTo };

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

      if (data?.session) {
        // Session created immediately (auto-confirm enabled)
        window.location.href = emailRedirectTo;
        return;
      }

      if (data?.user) {
        // Email confirmation required - redirect to check-email page
        window.location.href = `${base}/auth/check-email`;
        return;
      }

      // Fallback
      window.location.href = `${base}/auth/check-email`;
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
        <Logo size={36} />
        <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
          Secure · Compliance-First · Enterprise-Ready
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Main Signup Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
            <div className="text-center mb-8">
              {plan ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      {plan.name} Plan Selected
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Start Your {plan.name} Trial
                  </h1>
                  <p className="text-slate-400 mb-4">{plan.summary}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    {plan.key !== 'enterprise'
                      ? '14-day free trial'
                      : 'Enterprise onboarding'}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Join FormaOS
                  </h1>
                  <p className="text-slate-400">
                    Start building compliance into your organization
                  </p>
                </>
              )}
            </div>

            {/* Plan Features */}
            {plan && (
              <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 border border-sky-400/20">
                <div className="text-sm font-medium text-sky-200 mb-3">
                  What's included:
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            )}

            {/* Google Sign Up - Primary CTA */}
            <button
              onClick={signUpWithGoogle}
              disabled={isLoading}
              className="w-full rounded-lg bg-white text-slate-900 px-6 py-4 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading
                ? 'Creating your FormaOS account...'
                : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t border-white/20" />
              <span className="text-xs text-slate-400">or use email</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={signUpWithEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-slate-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create FormaOS Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {!plan && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-400/20">
                <div className="text-center">
                  <p className="text-xs text-slate-300 mb-2">
                    Haven't chosen a plan yet?
                  </p>
                  <button
                    onClick={() =>
                      window.location.assign(`${siteBase}/pricing`)
                    }
                    className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    Compare Plans →
                  </button>
                </div>
              </div>
            )}

            {/* Sign In Link */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                  href="/auth/signin"
                  className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Sign in to FormaOS
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4 text-sm text-slate-300">
            <Logo variant="mark" size={16} />
            <span>Loading FormaOS signup...</span>
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
