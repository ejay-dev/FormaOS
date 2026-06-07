'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { z } from 'zod';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
// OAuth consent branding can be further customized via Supabase Auth custom domains.
// See: https://supabase.com/docs/guides/auth/custom-domains

const DEFAULT_APP_BASE = 'https://app.formaos.com.au';
const SESSION_TIMEOUT_MS = 240000;
const RENDER_APP_BASE = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(
  /\/$/,
  '',
);

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

const fetchWithTimeout = async (
  url: string,
  init: RequestInit = {},
  timeoutMs = SESSION_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const getAuthBackendMessage = (
  error: string | null | undefined,
  fallback: string,
) => {
  if (error === 'backend_unavailable') {
    return 'Secure sign-in is temporarily unavailable while background services reconnect. Please try again shortly.';
  }
  if (error === 'too_many_requests') {
    return 'Too many requests. Please wait a few minutes and try again.';
  }
  return fallback;
};

function SignInContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [ssoOrgId, setSsoOrgId] = useState<string | null>(null);
  const [ssoRequired, setSsoRequired] = useState(false);
  const [existingSessionEmail, setExistingSessionEmail] = useState<
    string | null
  >(null);

  const logLoginFailure = useCallback(
    async (reason: string, provider: 'email' | 'google' = 'email') => {
      try {
        await fetch('/api/security/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'login_failure',
            metadata: {
              email: provider === 'email' ? email : undefined,
              provider,
              reason,
            },
          }),
        });
      } catch {
        // Best-effort logging
      }
    },
    [email],
  );

  const bootstrapAndRedirect = useCallback(async () => {
    const base = resolveAppBase();
    try {
      // MFA gate: if the account requires a TOTP step and this session
      // hasn't cleared it yet, hold the user at the challenge page rather
      // than minting a usable workspace session.
      try {
        const mfaRes = await fetchWithTimeout(
          '/api/auth/mfa-status',
          { method: 'GET' },
          10000,
        );
        if (mfaRes.ok) {
          const mfaPayload = (await mfaRes.json().catch(() => null)) as {
            requiresMfa?: boolean;
            passed?: boolean;
          } | null;
          if (mfaPayload?.requiresMfa && !mfaPayload?.passed) {
            window.location.href = `${base}/auth/mfa-challenge`;
            return { ok: true };
          }
        }
      } catch {
        // Fall through — bootstrap will fail closed if the session is
        // truly invalid; we never silently bypass the gate.
      }

      const response = await fetchWithTimeout('/api/auth/bootstrap', {
        method: 'POST',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return {
          ok: false,
          status: response.status,
          error: typeof payload?.error === 'string' ? payload.error : undefined,
        };
      }
      const payload = await response.json().catch(() => ({}));
      // v4-015: only accept same-origin redirects. `next.startsWith('http')`
      // previously sent users to any absolute URL the server returned —
      // a misconfigured bootstrap response or a compromised intermediary
      // becomes an open-redirect into a phishing page styled to look
      // like FormaOS. Treat anything that isn't a path-only redirect
      // (or an absolute URL whose origin matches `base`) as untrusted
      // and fall back to /app.
      const raw = typeof payload?.next === 'string' ? payload.next : '/app';
      let target = '/app';
      if (raw.startsWith('/') && !raw.startsWith('//')) {
        target = `${base}${raw}`;
      } else {
        try {
          const candidate = new URL(raw, base);
          if (candidate.origin === new URL(base).origin) {
            target = candidate.toString();
          }
        } catch {
          // fall through to /app
        }
      }
      window.location.href = target;
      return { ok: true };
    } catch (err) {
      console.error('[Auth] bootstrap failed:', err);
      return { ok: false, status: 0 };
    }
  }, []);

  // Check for success messages from URL params (e.g., session cleared after JWT rotation)
  useEffect(() => {
    const sessionCleared = searchParams.get('session_cleared');
    if (sessionCleared === 'true') {
      setSuccessMessage('Your session has been cleared. Please sign in again.');
    }
  }, [searchParams]);

  // Check for error messages from URL params (e.g., from auth callback)
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (!error) return;

    // Map all callback error codes to user-friendly messages
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
      setup_incomplete: 'Please complete your onboarding setup.',
    };

    const errorMsg =
      errorMessages[error] ??
      (message
        ? decodeURIComponent(message)
        : 'An error occurred during sign-in. Please try again.');
    setErrorMessage(errorMsg);
  }, [searchParams]);

  // Handle email confirmation or existing session redirects
  useEffect(() => {
    // If we arrived here with an error from the callback, do NOT attempt
    // automatic session bootstrap – show the error and let the user retry.
    const urlError = searchParams.get('error');
    if (urlError) return;

    const supabase = createSupabaseClient();

    const handleAuthRedirect = async () => {
      try {
        const hasHash =
          typeof window !== 'undefined' &&
          window.location.hash.includes('access_token=');
        let processedFreshTokens = false;
        if (hasHash) {
          const hash = window.location.hash.startsWith('#')
            ? window.location.hash.slice(1)
            : window.location.hash;
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              setErrorMessage(
                error.message ?? 'Authentication failed. Please sign in again.',
              );
              return;
            }
            processedFreshTokens = true;
            window.history.replaceState(
              null,
              '',
              `${window.location.pathname}${window.location.search}`,
            );
          }
        }

        const sessionResult = (await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          'session',
        )) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        const { data } = sessionResult;
        if (data?.session) {
          // Only auto-bootstrap when we just processed fresh OAuth/email tokens.
          // A stale session (cookie left over from a prior login) should NOT
          // silently redirect — that hides the form from anyone wanting to
          // sign in as a different user, and creates the appearance of a
          // multi-tenancy leak. Surface the active email instead and let the
          // user choose to continue or sign out and switch accounts.
          if (processedFreshTokens) {
            const bootstrapResult = await bootstrapAndRedirect();
            if (!bootstrapResult?.ok) {
              setErrorMessage(
                getAuthBackendMessage(
                  bootstrapResult?.error,
                  'We could not complete sign-in. Please refresh and try again.',
                ),
              );
            }
          } else {
            setExistingSessionEmail(data.session.user?.email ?? 'your account');
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('timeout')) {
          setSessionTimeout(true);
          console.error('[Auth] Session check timed out');
          setErrorMessage(
            'Having trouble verifying your session. Please refresh or try again.',
          );
          return;
        }
        setErrorMessage('Authentication failed. Please sign in again.');
      }
    };

    handleAuthRedirect();
  }, [bootstrapAndRedirect, searchParams]);

  // Enterprise SSO discovery (by email domain)
  useEffect(() => {
    const e = email.trim().toLowerCase();

    if (!e || !e.includes('@')) {
      setSsoOrgId(null);
      setSsoRequired(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/sso/discover?email=${encodeURIComponent(e)}`,
        );
        if (!res.ok) {
          setSsoOrgId(null);
          setSsoRequired(false);
          return;
        }
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          orgId?: string;
          enforceSso?: boolean;
        } | null;
        if (!json?.ok || !json?.orgId) {
          setSsoOrgId(null);
          setSsoRequired(false);
          return;
        }
        setSsoOrgId(String(json.orgId));
        setSsoRequired(Boolean(json.enforceSso));
      } catch {
        setSsoOrgId(null);
        setSsoRequired(false);
      }
    }, 450);

    return () => clearTimeout(handle);
  }, [email]);

  const startSsoLogin = useCallback(
    (next: string = '/app') => {
      if (!ssoOrgId) {
        setErrorMessage(
          'No SSO configuration was found for this email domain.',
        );
        return;
      }
      const base = resolveAppBase();
      const safeNext = next.startsWith('/') ? next : '/app';
      window.location.href = `${base}/api/sso/saml/login/${encodeURIComponent(
        ssoOrgId,
      )}?next=${encodeURIComponent(safeNext)}`;
    },
    [ssoOrgId],
  );

  const signInWithGoogle = async () => {
    setErrorMessage(null);
    setSessionTimeout(false);
    setIsLoading(true);
    try {
      const base = resolveAppBase();
      const supabase = createSupabaseClient();
      // v4-026: state cookie now set server-side as httpOnly via
      // /api/auth/oauth/init. The client never sees the state value
      // — it just consumes the returned URL. Falls back to the
      // legacy client-side path only if the init endpoint is
      // unavailable (preserves OAuth during partial outages).
      // Audit 2026-05-23: removed the document.cookie fallback that
      // ran when /api/auth/oauth/init returned non-2xx. The fallback
      // defeated v4-026's httpOnly state hardening: any init outage
      // silently downgraded every signed-in session to JS-readable
      // OAuth state, where an XSS could steal it. Better to fail
      // visibly so the user retries (and the team gets paged) than
      // to silently weaken the OAuth flow.
      const initRes = await fetch('/api/auth/oauth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          redirectTo: `${base}/auth/callback`,
        }),
      });
      if (!initRes.ok) {
        const message =
          initRes.status === 503
            ? 'OAuth is temporarily unavailable. Please try again in a moment, or sign in with email and password.'
            : `OAuth setup failed (${initRes.status}). Please try email sign-in or contact support.`;
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
            // Force Google's account chooser so users switching accounts
            // never silently re-land in a previously authenticated session.
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
        void logLoginFailure(error.message ?? 'oauth_error', 'google');
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage('No redirect URL returned from Google OAuth.');
        setIsLoading(false);
        void logLoginFailure('oauth_missing_redirect', 'google');
      }
    } catch (err) {
      console.error('[Auth] Google OAuth failed:', err);
      setErrorMessage('Unable to start Google sign in. Please try again.');
      setIsLoading(false);
      void logLoginFailure('oauth_exception', 'google');
    }
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSessionTimeout(false);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setIsLoading(true);

    // Hard enforcement: if this domain requires SSO, block password sign-in.
    if (ssoRequired && ssoOrgId) {
      setIsLoading(false);
      setErrorMessage(
        'Your organization requires SSO. Please use “Continue with SSO”.',
      );
      void logLoginFailure('sso_required', 'email');
      return;
    }

    // Audit 2026-05-26 (H3): per-email lockout check. After 5 failed
    // logins in 15 minutes, the account is locked for 15 minutes
    // regardless of source IP. The IP-keyed rate limiter still applies
    // separately. This pre-check saves a round-trip against Supabase
    // Auth for accounts in lockout.
    try {
      const lockoutRes = await fetch('/api/auth/check-lockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (lockoutRes.ok) {
        const lockoutData = (await lockoutRes.json()) as {
          locked?: boolean;
          retryAfterSeconds?: number;
        };
        if (lockoutData.locked) {
          const minutes = Math.max(
            1,
            Math.ceil((lockoutData.retryAfterSeconds ?? 900) / 60),
          );
          setErrorMessage(
            `This account is temporarily locked after too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or reset your password.`,
          );
          void logLoginFailure('account_locked', 'email');
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Network or 5xx on the lockout pre-check — proceed with the
      // signin attempt. We never want a buggy lockout check to be the
      // reason a legitimate user can't log in.
    }

    const supabase = createSupabaseClient();
    try {
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
        void logLoginFailure(error.message ?? 'invalid_credentials', 'email');
        setIsLoading(false);
        return;
      }

      const bootstrapResult = await bootstrapAndRedirect();
      if (!bootstrapResult?.ok) {
        setErrorMessage(
          getAuthBackendMessage(
            bootstrapResult?.error,
            'We could not complete sign-in. Please refresh and try again.',
          ),
        );
        setIsLoading(false);
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('timeout')) {
        setErrorMessage(
          'Having trouble signing you in. Please refresh and try again.',
        );
        void logLoginFailure('session_timeout', 'email');
      } else {
        setErrorMessage('Authentication failed. Please sign in again.');
        void logLoginFailure('auth_exception', 'email');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
        <Logo variant="wordmark" size={28} className="text-foreground" />
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Secure · Compliance-First · Enterprise-Ready
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Card */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to FormaOS
              </h1>
              <p className="text-muted-foreground">
                The compliance-first operating system for modern enterprises
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 p-4 rounded-lg bg-surface-1 border border-border">
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-xs font-medium text-muted-foreground">
                  Audit-ready controls
                </div>
              </div>
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-xs font-medium text-muted-foreground">
                  Evidence integrity
                </div>
              </div>
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-xs font-medium text-muted-foreground">
                  Access governance
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="mb-6 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            {sessionTimeout && (
              <div className="mb-6 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                <div className="font-semibold">Having trouble?</div>
                <div className="mt-1 text-warning/80">
                  Refresh the page or try again.
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 inline-flex items-center justify-center rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Refresh
                </button>
              </div>
            )}
            {existingSessionEmail && (
              <div className="mb-6 rounded-lg border border-info/20 bg-info/10 px-4 py-3 text-sm text-info">
                <div className="font-semibold">
                  You are already signed in as {existingSessionEmail}
                </div>
                <div className="mt-1 text-info/80">
                  Continue to your dashboard, or sign out to use a different
                  account.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await bootstrapAndRedirect();
                      if (!result?.ok) {
                        setErrorMessage(
                          getAuthBackendMessage(
                            result?.error,
                            'We could not complete sign-in. Please refresh and try again.',
                          ),
                        );
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-info/30 bg-info/10 px-3 py-1.5 text-xs font-semibold text-info hover:bg-info/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    Continue to dashboard
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const supabase = createSupabaseClient();
                        await supabase.auth.signOut();
                      } catch {
                        // Best-effort
                      }
                      setExistingSessionEmail(null);
                      window.location.href = '/auth/signin?session_cleared=true';
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-edge-3 bg-surface-1 px-3 py-1.5 text-xs font-semibold text-foreground/90 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    Sign out & use a different account
                  </button>
                </div>
              </div>
            )}

            {/* Google Sign In – standard Supabase OAuth flow. */}
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
              <div className="flex-1 border-t border-edge-2" />
              <span className="text-xs text-muted-foreground">
                or use email
              </span>
              <div className="flex-1 border-t border-edge-2" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={signInWithEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-foreground/70 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="w-full rounded-lg border border-edge-2 bg-surface-2 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
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

              {ssoOrgId ? (
                <div className="rounded-lg border border-border bg-surface-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Enterprise SSO detected
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ssoRequired
                          ? 'This organization requires SSO for sign-in.'
                          : 'You can sign in with SSO for faster enterprise access.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startSsoLogin('/app')}
                      disabled={isLoading}
                      className="shrink-0 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors disabled:opacity-50"
                    >
                      Continue with SSO
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                className={ssoRequired ? 'opacity-50 pointer-events-none' : ''}
              >
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-foreground/70"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-foreground hover:text-foreground/70 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-edge-2 bg-surface-2 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  required={!ssoRequired}
                  disabled={isLoading}
                  autoComplete="current-password"
                  enterKeyHint="go"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="mt-8 pt-6 border-t border-edge-2">
              <p className="text-center text-sm text-muted-foreground">
                New to FormaOS?{' '}
                <Link
                  href={`${RENDER_APP_BASE}/auth/signup`}
                  className="font-semibold text-foreground hover:text-foreground/70 transition-colors"
                >
                  Start your compliance journey
                </Link>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-xs text-muted-foreground/60">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Logo variant="mark" size={14} className="text-foreground" />
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

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-1 px-6 py-4 text-sm text-foreground/70">
            <Logo variant="mark" size={18} className="text-foreground" />
            <span>Loading FormaOS...</span>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
