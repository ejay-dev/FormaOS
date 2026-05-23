import { NextResponse } from 'next/server';
import { runBillingReconciliation } from '@/lib/billing/nightly-reconciliation';
import { billingLogger } from '@/lib/observability/structured-logger';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { captureRouteError } from '@/lib/observability/with-route-observability';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Nightly billing reconciliation cron.
 *
 * Audit 2026-05-23: `runBillingReconciliation` shipped but had no Vercel
 * cron entry — the reconciler was reachable only from the unscheduled
 * `runScheduledAutomation` orchestrator. Active customers with Stripe
 * drift (status/plan/period_end) silently piled up. This route closes
 * that gap.
 *
 * Auto-fix remains opt-in via BILLING_AUTO_FIX=true (default OFF) per
 * the v4-025 safeguard against silent downgrades from transient Stripe
 * 5xx — see lib/billing/nightly-reconciliation.ts:39-43. When auto-fix
 * is off this run still surfaces every discrepancy in
 * `billing_reconciliation_log` for operator review.
 */
export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  try {
    const result = await runBillingReconciliation();
    billingLogger.info('billing_reconcile_cron_completed', {
      checked: result.checked,
      discrepancies: result.discrepancies.length,
      autoFixed: result.autoFixed,
      requiresManual: result.requiresManual,
      durationMs: result.duration,
      errors: result.errors.length,
    });

    return NextResponse.json({
      ok: true,
      checked: result.checked,
      discrepancies: result.discrepancies.length,
      autoFixed: result.autoFixed,
      requiresManual: result.requiresManual,
      durationMs: result.duration,
      errors: result.errors,
    });
  } catch (error) {
    captureRouteError('cron.billing-reconcile', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'reconcile_failed',
      },
      { status: 500 },
    );
  }
}
