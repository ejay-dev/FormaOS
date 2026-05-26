import { NextResponse } from 'next/server';
import { runGracePeriodEnforcement } from '@/lib/billing/enforce-grace-period';
import { billingLogger } from '@/lib/observability/structured-logger';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { captureRouteError } from '@/lib/observability/with-route-observability';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Nightly grace-period enforcement cron.
 *
 * Audit 2026-05-26 (H6): past-due orgs entered the 3-day grace window
 * via `invoice.payment_failed`, but no automated job disabled their
 * entitlements at day 4. The per-write guard
 * (`assertOrgCanWrite`) covers interactive mutators, but background
 * paths (scheduled exports, automation runs, webhook fan-outs) need
 * a global cutoff. This cron scans every past-due subscription,
 * identifies orgs beyond the grace window, and calls
 * `disableEntitlementsForOrg` (idempotent).
 *
 * Recovery: `invoice.payment_succeeded` re-enables entitlements via
 * `syncEntitlementsForPlan` in the billing webhook handler. This cron
 * is one-directional — it disables only.
 */
export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  try {
    const result = await runGracePeriodEnforcement();
    billingLogger.info('grace_period_enforcement_cron_completed', {
      scanned: result.scanned,
      enforced: result.enforced,
      errors: result.errors.length,
      durationMs: result.durationMs,
    });

    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      enforced: result.enforced,
      errors: result.errors,
      durationMs: result.durationMs,
    });
  } catch (error) {
    captureRouteError('cron.enforce-grace-period', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'grace_period_enforcement_failed',
      },
      { status: 500 },
    );
  }
}
