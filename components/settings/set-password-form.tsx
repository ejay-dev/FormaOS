'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

type SetPasswordFormProps = {
  /** True when the user already has a password identity. Drives the
   *  heading/description so first-time setters and rotators see appropriate copy. */
  hasPassword: boolean;
};

export function SetPasswordForm({ hasPassword }: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 12) {
      setErrorMessage('Password must be at least 12 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errs = Array.isArray(payload?.errors)
          ? payload.errors
          : [
              payload?.error === 'too_many_requests'
                ? 'Too many requests. Please wait a few minutes and try again.'
                : payload?.error === 'password_reused'
                  ? 'This password was used recently. Choose a different one.'
                  : payload?.error === 'unauthorized'
                    ? 'Session expired. Refresh the page and try again.'
                    : 'Unable to update password.',
            ];
        setErrorMessage(errs.join(' '));
        return;
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-border bg-surface-1 p-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <KeyRound className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">
            {hasPassword ? 'Change password' : 'Set a password'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasPassword
              ? 'Rotate your sign-in password. You stay signed in on this device.'
              : 'You signed in with a magic link. Set a password so you can sign in with email + password from any device.'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-xs text-success"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Password {hasPassword ? 'updated' : 'set'}. Email + password sign-in
            is now active for this account.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-md">
        <div>
          <label
            htmlFor="new-password"
            className="block text-xs font-semibold text-muted-foreground mb-2"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="12+ characters"
              className="w-full rounded-lg border border-border bg-background/40 px-4 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              required
              disabled={isLoading}
              minLength={12}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs font-semibold text-muted-foreground mb-2"
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            required
            disabled={isLoading}
            minLength={12}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? 'Saving…'
            : hasPassword
              ? 'Update password'
              : 'Set password'}
        </button>
      </form>
    </section>
  );
}
