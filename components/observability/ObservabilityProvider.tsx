'use client';

/**
 * ObservabilityProvider (High-17)
 *
 * Mounted once at the root layout. Forces the analytics singleton (and
 * therefore PostHog init) to construct on the client immediately rather
 * than lazily-on-first-event. Without this, PostHog's `init()` was never
 * called from any render path — `getAnalytics()` exists but had no
 * import-time consumer at the React root, so events were silently
 * queued forever.
 *
 * Sentry init runs at module-import time via sentry.client.config.ts,
 * so it doesn't need a provider — but we record a marker so
 * /api/health/observability can surface "client booted" telemetry.
 */

import { useEffect } from 'react';
import { getAnalytics } from '@/lib/monitoring/analytics';

export function ObservabilityProvider() {
  useEffect(() => {
    // Construct the singleton — this triggers internal init() which
    // calls initPostHog() and flushes any queued events.
    getAnalytics();

    // Mark the client as booted so the /health/observability endpoint
    // can confirm the bundle actually loaded in a real browser, not
    // just that the env var is present at the server.
    try {
      window.localStorage.setItem(
        'fos:observability:client-booted-at',
        new Date().toISOString(),
      );
    } catch {
      // Private mode / disabled storage — non-fatal.
    }
  }, []);

  return null;
}
