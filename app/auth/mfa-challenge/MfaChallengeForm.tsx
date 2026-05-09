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

      if (res.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
        return;
      }

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (payload?.error === 'invalid_token') {
          setError('That code is not valid. Try again.');
        } else if (payload?.error === 'invalid_token_format') {
          setError('Enter a 6-digit code or a backup code.');
        } else {
          setError('We could not verify that code. Please try again.');
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
      <label className="block text-sm font-medium text-white">
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
          className="mt-2 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-base tracking-widest text-white placeholder:text-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          placeholder="123456"
        />
      </label>

      {error && (
        <div
          id="mfa-error"
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || token.length < 6}
        className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Verifying…' : 'Verify and continue'}
      </button>

      <p className="text-xs text-muted-foreground">
        Lost your device?{' '}
        <a
          href="/auth/signout"
          className="underline underline-offset-4 hover:text-white"
        >
          Sign out
        </a>{' '}
        and contact your administrator to reset MFA.
      </p>
    </form>
  );
}
