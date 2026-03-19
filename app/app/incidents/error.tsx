'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function IncidentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[IncidentsError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] px-6 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
          Incidents
        </p>
        <h1 className="mt-3 text-xl font-semibold">
          Unable to load incidents
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message ||
            'An unexpected error occurred while loading incident data.'}
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
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}
