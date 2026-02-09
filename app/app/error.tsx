'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('[DashboardError]', {
      message: error.message,
      name: error.name,
      digest: error.digest,
      pathname,
      stack: error.stack?.split('\n').slice(0, 8).join('\n'),
      timestamp: new Date().toISOString(),
    });
  }, [error, pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold">Command Center unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load the dashboard safely. Try again, or contact your
          administrator.
        </p>
        <div className="mt-4 p-3 rounded-lg bg-muted/30 text-left text-xs space-y-1">
          {error.digest && (
            <p className="text-muted-foreground">
              Error ID: <code className="font-mono">{error.digest}</code>
            </p>
          )}
          {error.message && (
            <p className="text-destructive break-words font-mono">
              {error.message.slice(0, 300)}
            </p>
          )}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Sign out &amp; retry
          </a>
        </div>
      </div>
    </div>
  );
}
