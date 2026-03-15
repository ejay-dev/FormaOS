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
      <div className="mx-auto max-w-3xl rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-rose-100">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-200">
          Executive Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Unable to load executive intelligence
        </h1>
        <p className="mt-3 text-sm text-rose-100/80">
          {error.message || 'An unexpected error interrupted the dashboard.'}
        </p>
        <div className="mt-6 flex gap-3">
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
            Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}
