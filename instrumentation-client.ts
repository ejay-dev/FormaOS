// Client-side Sentry initialization.
//
// Under Turbopack (`next build --turbopack`), `sentry.client.config.ts` is NOT
// auto-loaded the way it was under webpack — the Sentry SDK itself warns about
// this. Next.js loads THIS file (`instrumentation-client.ts`) on the client
// instead, so the browser SDK must be initialized here or client errors never
// reach Sentry. Keep this in sync with `sentry.client.config.ts` (retained for
// any non-Turbopack build path).
import * as Sentry from '@sentry/nextjs';
import { scrubPiiFromEvent } from '@/lib/sentry/scrub-pii';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session replay for debugging.
  // Audit 2026-05-26 — dropped from 0.1 to 0.02 (2% baseline sampling)
  // because 10% of every session was burning replay quota on healthy
  // traffic. On-error replays still capture at 1.0 so debugging
  // surfaces remain intact.
  replaysSessionSampleRate: 0.02,
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Network request failed',
    'Load failed',
    'Failed to fetch',
  ],

  // Scrub PII from error reports
  beforeSend: scrubPiiFromEvent,

  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
});

// Required for Sentry to instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
