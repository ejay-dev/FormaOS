'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
// TODO: For enterprise branding, use Supabase Custom Auth Domain instead of Google One Tap.
// See: https://supabase.com/docs/guides/auth/custom-domains

const DEFAULT_APP_BASE = 'https://app.formaos.com.au';
const SESSION_TIMEOUT_MS = 5000;
const RENDER_APP_BASE = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(
  /\/$/,
  '',
);

const resolveAppBase = () => {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  if (envBase) return envBase;
  if (typeof window === 'undefined') return DEFAULT_APP_BASE;
  const origin = window.location.origin.replace(/\/$/, '');
  const host = window.location.hostname;
  const isLocalhost =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.startsWith('127.') ||
    host === '0.0.0.0';
  if (isLocalhost || host.startsWith('app.')) return origin;
  return DEFAULT_APP_BASE;
};

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label}_timeout`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for error messages from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (!error) return;

    const errorMessages: Record<string, string> = {
      configuration_error: message
        ? decodeURIComponent(message)
        : 'Server configuration error. Please contact support.',
      oauth_error: message
        ? decodeURIComponent(message)
        : 'Google authentication failed. Please try again.',
      oauth_exchange_failed: message
        ? decodeURIComponent(message)
        : 'Authentication failed. Please try again.',
      oauth_failed: message
        ? decodeURIComponent(message)
        : 'Authentication failed. Please try again.',
      oauth_cancelled: message
        ? decodeURIComponent(message)
        : 'Sign in was cancelled. Please try again.',
      pkce_failed:
        'Sign-in verification failed. This can happen on some browsers. Please try again.',
      org_creation_failed: message
        ? decodeURIComponent(message)
        : 'Account setup failed. Please try signing in again.',
    };

    const errorMsg =
      errorMessages[error] ??
      (message
        ? decodeURIComponent(message)
        : 'An error occurred during sign-in. Please try again.');
    setErrorMessage(errorMsg);
  }, [searchParams]);

  const signInWithGoogle = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const base = resolveAppBase();
      const supabase = createSupabaseClient();
      const oauthResult = (await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${base}/auth/callback`,
          },
        }),
        SESSION_TIMEOUT_MS,
        'oauth',
      )) as Awaited<ReturnType<typeof supabase.auth.signInWithOAuth>>;
      const { data, error } = oauthResult;
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
    } catch (err) {
      console.error('[Auth] Google OAuth failed:', err);
      setErrorMessage('Unable to start Google sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const supabase = createSupabaseClient();
    try {
      const base = resolveAppBase();
      const passwordResult = (await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        SESSION_TIMEOUT_MS,
        'password_signin',
      )) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
      const { error } = passwordResult;

      if (error) {
        setErrorMessage(error.message ?? 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      window.location.href = `${base}/app`;
    } catch (err) {
      if (err instanceof Error && err.message.includes('timeout')) {
        setErrorMessage(
          'Having trouble signing you in. Please refresh and try again.',
        );
      } else {
        setErrorMessage('Authentication failed. Please sign in again.');
      }
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
        <div className="w-full max-w-md">
          {/* Welcome Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to FormaOS
              </h1>
              <p className="text-slate-400">
                The compliance-first operating system for modern enterprises
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-cyan-500/10 border border-emerald-400/20">
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-xs font-medium text-emerald-200">
                  Audit-ready controls
                </div>
              </div>
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 text-sky-400 mx-auto mb-1" />
                <div className="text-xs font-medium text-sky-200">
                  Evidence integrity
                </div>
              </div>
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-xs font-medium text-cyan-200">
                  Access governance
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            )}

            {/* Google Sign In – standard Supabase OAuth flow.
                TODO: For branded consent screen, enable Supabase Custom Auth Domain. */}
            <button
              onClick={signInWithGoogle}
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
              {isLoading ? 'Connecting to FormaOS...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t border-white/20" />
              <span className="text-xs text-slate-400">or use email</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={signInWithEmail} className="space-y-4">
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
                  placeholder="Enter your password"
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
                  'Signing in...'
                ) : (
                  <>
                    Access FormaOS
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-slate-400">
                New to FormaOS?{' '}
                <Link
                  href={`${RENDER_APP_BASE}/auth/signup`}
                  className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Start your compliance journey
                </Link>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Logo variant="mark" size={12} />
              <span>Enterprise-grade security</span>
            </div>
            <p>
              Your data is encrypted and protected with audit-ready security
              controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4 text-sm text-slate-300">
            <Logo variant="mark" size={16} />
            <span>Loading FormaOS...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
