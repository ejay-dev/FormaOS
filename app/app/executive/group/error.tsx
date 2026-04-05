'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ExecutiveError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Error ID: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
