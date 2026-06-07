'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ExecutiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ExecutiveDashboardErrorBoundary]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-foreground">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-destructive">
          Executive Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Unable to load executive intelligence
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error.message || 'An unexpected error interrupted the dashboard.'}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            Retry
          </button>
          <Link
            href="/app"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}
