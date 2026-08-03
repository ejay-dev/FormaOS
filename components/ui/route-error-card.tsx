'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import * as Sentry from '@sentry/react';
import Link from 'next/link';

/**
 * The single error surface for route boundaries.
 *
 * Route-level error.tsx files had each grown their own copy of this: most
 * rendered `error.message` straight to the user in production (leaking
 * internals such as failed SQL and RLS denials to whoever hit the bug),
 * only the app-segment boundary reported to Sentry, and the copy and
 * layout drifted per route — including one that opened with an uppercase
 * letter-spaced kicker.
 *
 * Behaviour that matters here:
 * - the raw message is shown in development only; users get the digest,
 *   which is what support actually needs to find the trace
 * - every boundary reports to Sentry, tagged with the area, so a spike in
 *   one module is visible without reading logs
 * - there is always a way forward: retry, and a route out of the failure
 */
export function RouteErrorCard({
  error,
  reset,
  area,
  title,
  description,
  homeHref = '/app',
  homeLabel = 'Back to dashboard',
  fullHeight = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Module name, used as the Sentry tag and in the default title. */
  area: string;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  /**
   * Fill the viewport. Set on boundaries that render without the app or
   * admin shell (root, auth, marketing, the standalone flows) — there the
   * default 60vh leaves the card stranded near the top of an empty window.
   */
  fullHeight?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(`[${area}Error]`, {
      message: error.message,
      name: error.name,
      digest: error.digest,
      pathname,
      stack: error.stack?.split('\n').slice(0, 8).join('\n'),
      timestamp: new Date().toISOString(),
    });

    try {
      Sentry.captureException(error, {
        tags: { boundary: area },
        extra: { digest: error.digest, pathname },
      });
    } catch {
      // A failure to report must never replace the error being reported.
    }
  }, [error, pathname, area]);

  return (
    <div
      className={`flex items-center justify-center bg-background px-6 text-foreground ${
        fullHeight ? 'min-h-[100dvh]' : 'min-h-[60vh]'
      }`}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">
          {title ?? `${area} could not be loaded`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ??
            'Something went wrong on our side. Trying again often resolves it.'}
        </p>

        {(error.digest || process.env.NODE_ENV !== 'production') && (
          <div className="mt-4 space-y-1 rounded-lg bg-muted/30 p-3 text-left text-xs">
            {error.digest && (
              <p className="text-muted-foreground">
                Reference: <code className="font-mono">{error.digest}</code>
              </p>
            )}
            {error.message && process.env.NODE_ENV !== 'production' && (
              <p className="break-words font-mono text-destructive">
                {error.message.slice(0, 300)}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RouteErrorCard;
