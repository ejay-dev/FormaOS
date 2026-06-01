import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Turbopack does not auto-load `sentry.server.config.ts`, so server-side
    // Sentry.init must be triggered explicitly here or `onRequestError`
    // (below) has nothing initialized to capture into. Importing the config
    // module runs its `Sentry.init()` at load time.
    await import('./sentry.server.config');

    const { registerOpenTelemetry } = await import(
      '@/lib/observability/opentelemetry'
    );
    await registerOpenTelemetry();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Same Turbopack caveat for the edge runtime (middleware / edge routes).
    await import('./sentry.edge.config');
  }
}

/**
 * v4-030: Next.js 15 `onRequestError` hook so RSC + server-action
 * errors that don't propagate to a route handler still land in
 * Sentry. Pre-fix, errors thrown inside React Server Components
 * (page.tsx await calls, server-actions invoked via form actions)
 * showed up as generic 500s in Vercel logs but never surfaced in
 * the Sentry alert pipeline.
 */
export const onRequestError = Sentry.captureRequestError;
