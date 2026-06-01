'use client';

// Root error boundary. Unlike `app/error.tsx` (which only catches errors in
// the route segment), `global-error.tsx` catches errors thrown in the ROOT
// layout itself and replaces the whole document. Without it, a root-layout
// crash renders Next's default white screen AND bypasses Sentry capture.
// It must render its own <html>/<body> because it replaces the root layout.
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      Sentry.captureException(error, {
        tags: { boundary: 'global-root' },
        extra: { digest: error.digest },
      });
    } catch {
      // Never let error reporting throw inside the error boundary.
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            background: '#0b0c0d',
            color: '#e5e7eb',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              textAlign: 'center',
              border: '1px solid #27272a',
              borderRadius: '1rem',
              padding: '2rem',
              background: '#141517',
            }}
          >
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              The application hit an unexpected error. Please try again, or
              contact support if it persists.
            </p>
            {/* Never expose error.message in production — it can leak stack
                traces, DB names, internal paths. Sentry has the full payload;
                users get the digest as a support reference. */}
            {error.digest && (
              <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                Error ID: <code style={{ fontFamily: 'monospace' }}>{error.digest}</code>
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#f4f4f5',
                color: '#0b0c0d',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
