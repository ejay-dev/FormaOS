import 'server-only';

import * as Sentry from '@sentry/nextjs';

/**
 * v4-009: Sentry capture helper for /api route handlers.
 *
 * Background: cron, billing, and internal-trigger routes had zero
 * Sentry capture before this. Errors thrown inside handlers either
 * propagated as opaque Vercel 5xx responses (no breadcrumb) or were
 * caught by inner try/catch blocks that returned a JSON 500 — also
 * with no Sentry breadcrumb. The one real prod 504 during the v4
 * audit (cron/scheduled-reports at 16:00 UTC) generated no alert.
 *
 * Usage:
 *
 *   try {
 *     // route body
 *   } catch (error) {
 *     captureRouteError('cron.scheduled-reports', error, {
 *       method: 'GET',
 *       url: request.url,
 *     });
 *     return NextResponse.json({ ok: false, ... }, { status: 500 });
 *   }
 *
 * The helper:
 * - tags the event with `route` and `method` so Sentry grouping/search
 *   lines up with the route tree (use the dotted form like
 *   `billing.webhook`, `cron.compliance-check`)
 * - dedupes via Sentry's default fingerprint
 * - never throws — safe to call from any catch block
 */
type RouteErrorContext = {
  method?: string;
  url?: string;
  [key: string]: unknown;
};

export function captureRouteError(
  routeName: string,
  error: unknown,
  context: RouteErrorContext = {},
): void {
  try {
    Sentry.captureException(error, {
      tags: {
        route: routeName,
        method: context.method ?? 'unknown',
      },
      extra: {
        url: context.url,
        ...context,
      },
    });
  } catch {
    // Sentry transport failure is not worth crashing the request over.
  }
}
