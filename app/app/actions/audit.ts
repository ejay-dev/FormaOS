'use server';

/**
 * Audit server-actions-003 (2026-05-22) — wrapper layer.
 *
 * This file is the server-action surface for `logActivity`. It
 * enforces caller authz (session→orgId match) and delegates the
 * actual DB write to `logActivityCore` in `@/lib/audit/log-activity`.
 */

// Note: `AuditAction` type is intentionally NOT re-exported here. Next.js's
// 'use server' compiler scans this file's exports and rejects anything
// that isn't an async function (even pure type re-exports). Consumers that
// need the type must import it directly from `@/lib/audit/log-activity`.

import { rbacLogger } from '@/lib/observability/structured-logger';
import { getUserOrgMembership } from '@/app/app/actions/rbac';
import {
  type AuditAction,
  logActivityCore,
} from '@/lib/audit/log-activity';

/**
 * CENTRALIZED AUDIT LOGGER
 * Call this from ANY server action to record an event.
 * It fails silently (console error) so it doesn't block the user's main action.
 */
export async function logActivity(
  organizationId: string,
  action: AuditAction,
  details: Record<string, any>,
) {
  let callerMembership: Awaited<ReturnType<typeof getUserOrgMembership>>;
  try {
    callerMembership = await getUserOrgMembership();
  } catch (err) {
    console.warn(`[AUDIT SKIPPED] caller has no org membership: ${action}`, err);
    return;
  }
  if (callerMembership.orgId !== organizationId) {
    rbacLogger.warn('audit_cross_org_rejected', {
      action,
      callerOrgId: callerMembership.orgId,
      targetOrgId: organizationId,
    });
    return;
  }

  return logActivityCore(organizationId, action, details);
}
