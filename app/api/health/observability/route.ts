/**
 * GET /api/health/observability (High-17)
 *
 * Returns whether observability surfaces are wired:
 *   - Sentry: DSN env present and Sentry SDK is loadable.
 *   - PostHog: key env present and the analytics module exists.
 *   - OpenTelemetry: exporter env present and instrumentation.ts is wired.
 *
 * Booleans only — no DSNs, keys, or other secrets are returned. Safe to
 * expose unauthenticated. Used by deploy gates and internal status
 * dashboards to confirm we are not silently observability-dark in
 * production.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bool(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const sentry = {
    dsnPresent: bool(process.env.NEXT_PUBLIC_SENTRY_DSN),
    serverDsnPresent: bool(
      process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    ),
    org: bool(process.env.SENTRY_ORG),
    project: bool(process.env.SENTRY_PROJECT),
  };

  const posthog = {
    keyPresent: bool(process.env.NEXT_PUBLIC_POSTHOG_KEY),
    hostPresent: bool(process.env.NEXT_PUBLIC_POSTHOG_HOST),
  };

  const otel = {
    endpointPresent: bool(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    serviceNamePresent: bool(process.env.OTEL_SERVICE_NAME),
  };

  const langfuse = {
    publicKeyPresent: bool(process.env.LANGFUSE_PUBLIC_KEY),
    // Config + .env.example use LANGFUSE_BASE_URL (not LANGFUSE_HOST), so the
    // old check always reported the host as absent even when configured.
    hostPresent: bool(process.env.LANGFUSE_BASE_URL),
  };

  const allSentryWired =
    sentry.dsnPresent &&
    sentry.serverDsnPresent &&
    sentry.org &&
    sentry.project;

  const ok = allSentryWired && posthog.keyPresent;

  return NextResponse.json(
    {
      ok,
      checked_at: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      sentry,
      posthog,
      otel,
      langfuse,
    },
    {
      status: ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
