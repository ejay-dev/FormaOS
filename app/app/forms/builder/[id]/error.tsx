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
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100">
        <h1 className="text-xl font-semibold">Form builder failed to load</h1>
        <p className="mt-2 text-sm text-rose-100/80">
          {error.message || 'An unexpected error interrupted the form builder.'}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-400"
          >
            Retry
          </button>
          <Link
            href="/app"
            className="rounded-lg border border-rose-300/30 px-4 py-2 text-sm font-medium text-rose-100 hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
