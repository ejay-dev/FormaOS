import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { disableEntitlementsForOrg } from '@/lib/billing/entitlements';
import { isOrgReadOnly } from '@/lib/billing/grace-period';
import { billingLogger } from '@/lib/observability/structured-logger';

/**
 * Server-action / API-route write guard for the past-due grace period.
 *
 * Past-due orgs get 3 days of full access (handled in `getGracePeriodStatus`).
 * After that window they go read-only. Without an enforcement call,
 * `isOrgReadOnly` was dead code — the audit shipped, the dunning email
 * fired, but write access remained. This helper centralises the check
 * so any mutator can opt in with one line:
 *
 *   await assertOrgCanWrite(orgId); // throws OrgReadOnlyError if locked
 *
 * Throws `OrgReadOnlyError` rather than returning a flag so callers can't
 * forget to branch on it. The error carries a stable `code` ('org_read_only')
 * and `daysOverdue` so server actions can render a precise lockout message.
 *
 * The defense-in-depth pair is `runGracePeriodEnforcement()` below — a
 * nightly cron that proactively disables entitlements on any org past
 * the grace window. The per-write guard protects interactive mutators;
 * the cron covers background paths (scheduled exports, automation runs,
 * webhook fan-outs) that don't go through server actions.
 */

export class OrgReadOnlyError extends Error {
  readonly code = 'org_read_only' as const;
  readonly statusCode = 423; // RFC 4918 — Locked

  constructor(
    readonly orgId: string,
    readonly daysOverdue: number,
  ) {
    super(
      `Organisation ${orgId} is in read-only mode (payment overdue ${daysOverdue} day(s) past grace period).`,
    );
    this.name = 'OrgReadOnlyError';
  }
}

export async function assertOrgCanWrite(orgId: string): Promise<void> {
  const supabase = createSupabaseOrgClient(orgId);
  const { data } = await supabase
    .from('org_subscriptions')
    .select('status, payment_failed_at')
    .maybeSingle();

  if (!data) return; // No subscription row → no enforcement (e.g. trial)

  if (
    !isOrgReadOnly({
      status: data.status,
      payment_failed_at: data.payment_failed_at,
    })
  ) {
    return;
  }

  const failedAt = data.payment_failed_at
    ? new Date(data.payment_failed_at)
    : new Date();
  const daysOverdue = Math.max(
    0,
    Math.floor(
      (Date.now() - failedAt.getTime()) / (24 * 60 * 60 * 1000),
    ) - 3,
  );

  throw new OrgReadOnlyError(orgId, daysOverdue);
}

// ---------------------------------------------------------------------------
// Nightly enforcer (cron). Intentionally cross-tenant: scans every
// past-due subscription, identifies orgs beyond the grace window, and
// disables their entitlements. Idempotent — re-running is a no-op for
// orgs already disabled. Payment recovery (invoice.payment_succeeded
// webhook) re-enables entitlements via `syncEntitlementsForPlan`.
// ---------------------------------------------------------------------------

const GRACE_PERIOD_DAYS = 3;

export interface GracePeriodEnforcementResult {
  scanned: number;
  enforced: number;
  errors: Array<{ orgId: string; message: string }>;
  durationMs: number;
}

export async function runGracePeriodEnforcement(): Promise<GracePeriodEnforcementResult> {
  const startedAt = Date.now();
  const admin = createSupabaseAdminClient();

  // Past-due orgs whose payment_failed_at is older than 3 days. Listing
  // intentionally crosses tenants — there's no per-org caller and the
  // org filter on the per-row disable below is set from the row itself.
  const cutoff = new Date(
    Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: rows, error } = await admin
    .from('org_subscriptions')
    .select('organization_id, payment_failed_at, status')
    .eq('status', 'past_due')
    .not('payment_failed_at', 'is', null)
    .lt('payment_failed_at', cutoff);

  if (error) {
    billingLogger.error(
      'grace_period_enforcement_query_failed',
      new Error(error.message),
    );
    return {
      scanned: 0,
      enforced: 0,
      errors: [{ orgId: '*', message: error.message }],
      durationMs: Date.now() - startedAt,
    };
  }

  const subscriptions = (rows ?? []) as Array<{
    organization_id: string;
    payment_failed_at: string;
    status: string;
  }>;

  const errors: Array<{ orgId: string; message: string }> = [];
  let enforced = 0;

  for (const sub of subscriptions) {
    try {
      await disableEntitlementsForOrg(sub.organization_id);
      enforced += 1;
      billingLogger.info('grace_period_enforced', {
        orgId: sub.organization_id,
        paymentFailedAt: sub.payment_failed_at,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      errors.push({ orgId: sub.organization_id, message });
      billingLogger.error(
        'grace_period_enforcement_failed_for_org',
        err instanceof Error ? err : new Error(message),
        { orgId: sub.organization_id },
      );
    }
  }

  return {
    scanned: subscriptions.length,
    enforced,
    errors,
    durationMs: Date.now() - startedAt,
  };
}
