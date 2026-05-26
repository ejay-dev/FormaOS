import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CSP violation reporting endpoint.
 *
 * Audit 2026-05-26 (H2 step 1): browsers POST violation reports here
 * when the Report-Only CSP (set in proxy.ts) catches a violation. The
 * enforcing CSP is unchanged — this is data-collection only — but the
 * collected violations are what we'll use to decide when it's safe to
 * remove `'unsafe-inline'` from `style-src` on the enforcing header.
 *
 * Two report shapes to handle:
 *   - Legacy `application/csp-report`: `{ "csp-report": { ... } }`
 *   - Modern `application/reports+json`: array of
 *     `{ type: 'csp-violation', body: { ... } }`
 *
 * Both are forwarded to Sentry as a structured `cspViolation` event.
 *
 * Why no CSRF check: violation reports are sent by the browser
 * automatically — there's no Origin header on them. The
 * /api/csp-report path is added to the CSRF allowlist in proxy.ts.
 *
 * Sampling: violation reports can be high-volume (one per blocked
 * resource per page view). We sample 5% to stay within Sentry quota.
 * Increase if/when we need to drill into a specific violation
 * cluster.
 */

const SAMPLE_RATE = 0.05;

type LegacyCspReport = {
  'csp-report'?: Record<string, unknown>;
};

type ModernCspReport = Array<{
  type: string;
  body: Record<string, unknown>;
}>;

function extractViolation(
  payload: unknown,
): Record<string, unknown> | null {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const legacy = (payload as LegacyCspReport)['csp-report'];
    if (legacy && typeof legacy === 'object') return legacy;
  }
  if (Array.isArray(payload)) {
    const entry = (payload as ModernCspReport).find(
      (r) => r?.type === 'csp-violation' && r?.body,
    );
    if (entry) return entry.body;
  }
  return null;
}

export async function POST(request: Request) {
  if (Math.random() > SAMPLE_RATE) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const violation = extractViolation(raw);
    if (!violation) {
      return new NextResponse(null, { status: 204 });
    }

    const directive =
      (violation['violated-directive'] as string | undefined) ||
      (violation['effective-directive'] as string | undefined) ||
      'unknown';
    const blockedUri =
      (violation['blocked-uri'] as string | undefined) ||
      (violation['blockedURL'] as string | undefined) ||
      'unknown';
    const documentUri =
      (violation['document-uri'] as string | undefined) ||
      (violation['documentURL'] as string | undefined) ||
      'unknown';

    Sentry.captureMessage('csp_violation', {
      level: 'warning',
      tags: {
        directive,
        report_type: Array.isArray(raw) ? 'reports-api' : 'csp-report',
      },
      extra: {
        directive,
        blockedUri,
        documentUri,
        violation,
      },
    });
  } catch {
    // CSP reports are best-effort; never let a malformed report
    // surface as a 5xx that retries.
  }

  return new NextResponse(null, { status: 204 });
}
