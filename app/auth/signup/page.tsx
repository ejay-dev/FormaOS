'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { PLAN_CATALOG, resolvePlanKey } from '@/lib/plans';
import {
  CHECKOUT_INTENT_COOKIE,
  CHECKOUT_INTENT_TTL_SECONDS,
  isSelfServePlan,
} from '@/lib/billing/checkout-intent';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
// OAuth consent branding can be further customized via Supabase Auth custom domains.
// See: https://supabase.com/docs/guides/auth/custom-domains

const DEFAULT_APP_BASE = 'https://app.formaos.com.au';
const DEFAULT_SITE_BASE = 'https://www.formaos.com.au';
const SESSION_TIMEOUT_MS = 240000;

const resolveAppBase = () => {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    const host = window.location.hostname;
    const isLocalhost =
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.startsWith('127.') ||
      host === '0.0.0.0';
    if (isLocalhost) return origin;
  }
  if (envBase) return envBase;
  if (typeof window === 'undefined') return DEFAULT_APP_BASE;
  const origin = window.location.origin.replace(/\/$/, '');
  const host = window.location.hostname;
  if (host.startsWith('app.')) return origin;
  return DEFAULT_APP_BASE;
};

const resolveSiteBase = () => {
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    const host = window.location.hostname;
    const isLocalhost =
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.startsWith('127.') ||
      host === '0.0.0.0';
    if (isLocalhost) return origin;
  }
  if (envBase) return envBase;
  if (typeof window === 'undefined') return DEFAULT_SITE_BASE;
  return window.location.origin.replace(/\/$/, '');
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

function SignUpContent() {
  const searchParams = useSearchParams();
  const planParam = resolvePlanKey(searchParams.get('plan'));
  const journeyParamRaw = searchParams.get('journey');
  const journeyParam =
    journeyParamRaw &&
    ['evaluate', 'prove', 'operate', 'govern'].includes(journeyParamRaw)
      ? journeyParamRaw
      : null;
  const plan = useMemo(
    () => (planParam ? PLAN_CATALOG[planParam] : null),
    [planParam],
  );

  // If the visitor arrived from a self-serve pricing CTA (?intent=checkout),
  // stash the plan in a short-lived cookie so we can auto-redirect them into
  // Stripe Checkout after email verification + org bootstrap completes.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const intent = searchParams.get('intent');
    if (intent === 'checkout' && planParam && isSelfServePlan(planParam)) {
      document.cookie = `${CHECKOUT_INTENT_COOKIE}=${encodeURIComponent(
        planParam,
      )}; path=/; max-age=${CHECKOUT_INTENT_TTL_SECONDS}; SameSite=Lax`;
    }
  }, [planParam, searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const signUpWithGoogle = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    const appBase = resolveAppBase();
    const journeySuffix = journeyParam
      ? `&journey=${encodeURIComponent(journeyParam)}`
      : '';
    const redirectTo = plan
      ? `${appBase}/auth/callback?plan=${encodeURIComponent(plan.key)}${journeySuffix}`
      : `${appBase}/auth/callback${journeyParam ? `?journey=${encodeURIComponent(journeyParam)}` : ''}`;
    const supabase = createSupabaseClient();
    try {
      // Audit 2026-05-23: removed the document.cookie fallback — same
      // rationale as SignInPageContent.tsx. v4-026 hardened OAuth state
      // to httpOnly; the silent fallback re-downgraded it whenever the
      // init endpoint hiccupped. Fail visibly instead.
      const initRes = await fetch('/api/auth/oauth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', redirectTo }),
      });
      if (!initRes.ok) {
        const message =
          initRes.status === 503
            ? 'OAuth is temporarily unavailable. Please try again in a moment, or sign up with email and password.'
            : `OAuth setup failed (${initRes.status}). Please try email sign-up or contact support.`;
        setErrorMessage(message);
        setIsLoading(false);
        return;
      }
      const { url } = (await initRes.json()) as { url: string };
      const oauthRedirect = { state: '', redirectTo: url };
      const oauthResult = (await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: oauthRedirect.redirectTo,
            // Force Google's account chooser so users testing signup or
            // switching accounts never silently re-land in a previously
            // authenticated Google session.
            queryParams: { prompt: 'select_account' },
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
      setErrorMessage('Unable to start Google sign up. Please try again.');
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

    if (password.length < 12) {
      setErrorMessage('Password must be at least 12 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const validationResponse = await fetch('/api/auth/password/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!validationResponse.ok) {
        const validationPayload = await validationResponse
          .json()
          .catch(() => ({}));
        const errors = Array.isArray(validationPayload?.errors)
          ? validationPayload.errors
          : ['Password does not meet security requirements'];
        setErrorMessage(errors.join(' '));
        setIsLoading(false);
        return;
      }

      const appBase = resolveAppBase();
      const signupResponse = await withTimeout(
        fetch('/api/auth/email-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            plan: plan?.key ?? null,
            marketing_consent: marketingConsent,
          }),
        }),
        SESSION_TIMEOUT_MS,
        'signup_api',
      );

      const payload = await signupResponse.json().catch(() => ({}));
      if (!signupResponse.ok || !payload?.ok) {
        const mappedMessage =
          payload?.error === 'account_already_exists'
            ? 'An account with this email already exists. Please sign in instead.'
            : payload?.error === 'backend_unavailable'
              ? 'Email/password sign up is temporarily unavailable right now. Please continue with Google or try again shortly.'
            : payload?.error === 'signup_timeout'
              ? 'Email/password sign up is temporarily unavailable right now. Please continue with Google or try again shortly.'
              : payload?.error === 'too_many_requests'
                ? 'Too many requests. Please wait a few minutes and try again.'
            : payload?.error === 'email_delivery_failed'
              ? 'Account created but we could not deliver the confirmation email. Please use resend.'
              : Array.isArray(payload?.errors)
                ? payload.errors.join(' ')
                : payload?.message || 'Unable to create your account right now.';
        setErrorMessage(mappedMessage);
        setIsLoading(false);
        return;
      }

      const planQuery = plan ? `&plan=${encodeURIComponent(plan.key)}` : '';
      const journeyQuery = journeyParam
        ? `&journey=${encodeURIComponent(journeyParam)}`
        : '';
      window.location.href = `${appBase}/auth/check-email?email=${encodeURIComponent(email)}${planQuery}${journeyQuery}`;
    } catch (err) {
      if (err instanceof Error && err.message.includes('timeout')) {
        setErrorMessage(
          'Email/password sign up is temporarily unavailable right now. Please continue with Google or try again shortly.',
        );
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
        <Logo variant="wordmark" size={28} className="text-foreground" />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Main Signup Card */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-center mb-8">
              {plan ? (
                <>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Create your {plan.name} account
                  </h1>
                  <p className="text-muted-foreground">{plan.summary}</p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Create your FormaOS account
                  </h1>
                  <p className="text-muted-foreground">
                    Compliance operations for NDIS, aged care and healthcare
                    providers.
                  </p>
                </>
              )}
            </div>

            {/* Plan Features */}
            {plan && (
              <div className="mb-8 p-4 rounded-lg bg-surface-1 border border-border">
                <div className="text-sm font-medium text-foreground mb-3">
                  What's included:
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {successMessage}
              </div>
            )}

            {/* Google Sign Up – standard Supabase OAuth flow. */}
            <button
              onClick={signUpWithGoogle}
              disabled={isLoading}
              className="w-full rounded-lg bg-foreground text-background px-6 py-4 text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or use email</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={signUpWithEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-foreground mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-foreground mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  disabled={isLoading}
                  minLength={12}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  aria-describedby="password-requirements"
                />
                <p
                  id="password-requirements"
                  className="mt-2 text-xs text-muted-foreground"
                >
                  At least 12 characters, with an uppercase letter, a lowercase
                  letter, a number and a symbol.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-foreground mb-2"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  enterKeyHint="go"
                />
              </div>

              <div className="marketing-consent flex items-start gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
                <input
                  id="marketing-consent"
                  name="marketing_optin"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 h-4 w-4 rounded border-border bg-surface-2 text-primary focus:ring-2 focus:ring-ring"
                />
                <label
                  htmlFor="marketing-consent"
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  Send me FormaOS product updates and compliance insights via
                  email. Optional — you can unsubscribe at any time. This is
                  separate from essential account communications.
                </label>
              </div>

              <button
                type="submit"
                data-testid="signup-submit-button"
                disabled={isLoading}
                className="w-full rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {!plan && (
              <div className="mt-6 p-4 rounded-lg bg-surface-1 border border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Haven't chosen a plan yet?
                  </p>
                  <button
                    onClick={() =>
                      window.location.assign(`${resolveSiteBase()}/pricing`)
                    }
                    className="text-xs font-semibold text-primary hover:opacity-90 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Compare plans →
                  </button>
                </div>
              </div>
            )}

            {/* Sign In Link */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/signin"
                  className="font-semibold text-primary hover:opacity-90 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Sign in
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
            <Logo variant="mark" size={18} className="text-foreground" />
            <span>Loading FormaOS signup...</span>
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
