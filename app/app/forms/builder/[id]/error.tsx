'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function FormBuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FormBuilderErrorBoundary]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-foreground">
        <h1 className="text-xl font-semibold">Form builder failed to load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'An unexpected error interrupted the form builder.'}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            Retry
          </button>
          <Link
            href="/app"
            className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
