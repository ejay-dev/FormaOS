'use server';

/**
 * Audit server-actions-003 (2026-05-22) — wrapper layer.
 *
 * This file is the server-action surface for `logAuditEvent`. The
 * exported function enforces caller authz (session→orgId match) and
 * delegates the actual DB write — including the service-role admin
 * fallback — to `logAuditEventCore` in `@/lib/audit/log-audit-event`.
 *
 * Direct lib import is reserved for server-only background paths that
 * already have a trusted orgId. The admin-client fallback inside the
 * core is RLS-bypassing; it must NEVER run before caller authz.
 */

import { getUserOrgMembership } from '@/app/app/actions/rbac';
import {
  type AuditEventInput,
  type AuditEventOptions,
  logAuditEventCore,
} from '@/lib/audit/log-audit-event';

export async function logAuditEvent(
  payload: AuditEventInput,
  options: AuditEventOptions = {},
) {
  const required = options.required === true;

  let callerMembership: Awaited<ReturnType<typeof getUserOrgMembership>>;
  try {
    callerMembership = await getUserOrgMembership();
  } catch (err) {
    if (required) throw err;
    console.warn('[Audit] logAuditEvent called without active session', {
      action: payload.actionType,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false as const, error: 'Unauthorized' };
  }
  if (callerMembership.orgId !== payload.organizationId) {
    const message = `Access denied: cross-organization audit write (caller org ${callerMembership.orgId} attempted to write to ${payload.organizationId})`;
    if (required) throw new Error(message);
    console.error('[Audit] cross-org audit write rejected', {
      action: payload.actionType,
      callerOrgId: callerMembership.orgId,
      targetOrgId: payload.organizationId,
    });
    return { success: false as const, error: message };
  }

  return logAuditEventCore(payload, options);
}
