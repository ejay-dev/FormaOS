'use client';

import { useState } from 'react';

const MAX_LEN = 16;

export function MfaChallengeForm() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = token.replace(/\s+/g, '');
    if (trimmed.length < 6) {
      setError('Enter a 6-digit code or a backup code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        // Map every error code the /api/auth/mfa-verify route can emit
        // (rate_limited, invalid_body, invalid_token_format, unauthorized,
        // invalid_token, mfa_verify_failed) onto a user-actionable
        // message. Falling through to a generic "could not verify" was
        // the original bug — every distinct failure mode looked the
        // same and the user had no way to tell network from typo from
        // expired session.
        switch (payload?.error) {
          case 'rate_limited':
            setError(
              'Too many attempts. Please wait a few minutes and try again.',
            );
            break;
          case 'invalid_token':
            setError('That code is not valid. Try again.');
            break;
          case 'invalid_token_format':
            setError('Enter a 6-digit code or a backup code.');
            break;
          case 'invalid_body':
            setError(
              'The form submission was malformed. Please refresh the page and try again.',
            );
            break;
          case 'unauthorized':
            setError(
              'Your session expired before we could verify the code. Please sign in again.',
            );
            break;
          case 'mfa_verify_failed':
            setError(
              'MFA service is temporarily unavailable. Please try again in a moment.',
            );
            break;
          default:
            // 429 fallback for callers that intercept before reading the
            // body, plus genuinely unknown codes.
            if (res.status === 429) {
              setError(
                'Too many attempts. Please wait a few minutes and try again.',
              );
            } else {
              setError(
                `We could not verify that code (status ${res.status}). Please try again or contact support.`,
              );
            }
            break;
        }
        return;
      }

      // Cleared the gate — bootstrap the workspace and redirect into /app.
      const bootstrap = await fetch('/api/auth/bootstrap', { method: 'POST' });
      const payload = (await bootstrap.json().catch(() => ({}))) as {
        next?: string;
      };
      const next =
        typeof payload?.next === 'string' && payload.next.startsWith('/')
          ? payload.next
          : '/app';
      window.location.href = next;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block text-sm font-medium text-foreground">
        Verification code
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={MAX_LEN}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'mfa-error' : undefined}
          className="mt-2 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-base tracking-widest tabular-nums text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="123456"
        />
      </label>

      {error && (
        <div
          id="mfa-error"
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || token.length < 6}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {submitting ? 'Verifying…' : 'Verify and continue'}
      </button>

      <p className="text-xs text-muted-foreground">
        Lost your device?{' '}
        <a
          href="/auth/signout"
          className="underline underline-offset-4 hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign out
        </a>{' '}
        and contact your administrator to reset MFA.
      </p>
    </form>
  );
}
