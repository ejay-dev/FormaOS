'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Client-side error boundary that wraps the entire app shell.
 *
 * If ANY component inside the sidebar/topbar/content tree throws during
 * render, this catches it and shows a controlled fallback instead of the
 * generic "Something went wrong" page.
 *
 * Diagnostic info is logged so it shows up in Vercel function logs.
 */
export class AppShellErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detailed diagnostics — visible in Vercel function logs
    console.error('[AppShellErrorBoundary] Caught render error:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 6).join('\n'),
      componentStack: errorInfo.componentStack
        ?.split('\n')
        .slice(0, 8)
        .join('\n'),
    });

    // Sentry-style reporting (non-PII)
    try {
      Sentry.captureException(error, {
        tags: { boundary: 'app-shell' },
        extra: {
          componentStack: errorInfo.componentStack
            ?.split('\n')
            .slice(0, 8)
            .join('\n'),
        },
      });
    } catch {
      // Ignore Sentry failures
    }
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            <h1 className="text-xl font-semibold">
              FormaOS couldn&apos;t load
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The app hit an unexpected error. This has been logged
              automatically.
            </p>
            {err?.message && (
              <pre className="mt-4 max-h-24 overflow-auto rounded-lg bg-muted/50 p-3 text-left text-xs text-muted-foreground">
                {err.message}
              </pre>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Try again
              </button>
              <a
                href="/workspace-recovery?from=app-shell-error"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Recover workspace
              </a>
              <a
                href="/auth/signin"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Sign out &amp; retry
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
