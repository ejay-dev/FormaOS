import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isOrgReadOnly } from '@/lib/billing/grace-period';

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
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('org_subscriptions')
    .select('status, payment_failed_at')
    .eq('organization_id', orgId)
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
