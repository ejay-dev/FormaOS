'use client';

import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AuthError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
          Authentication
        </p>
        <h1 className="mt-3 text-xl font-semibold">
          Unable to load authentication
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message ||
            'An unexpected error occurred during authentication.'}
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Error ID: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
