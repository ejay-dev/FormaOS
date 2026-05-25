/**
 * Audit server-actions-003 (2026-05-22): lib-level core for the
 * centralized `logActivity` helper. Does NOT verify caller authz —
 * the server-action wrapper at `@/app/app/actions/audit` enforces
 * the session→orgId match before delegating here. This core resolves
 * the actor from the current Supabase session if available; callers
 * with no session are no-ops (back-compat with original
 * "fail-silently" behaviour).
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rbacLogger } from '@/lib/observability/structured-logger';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { consoleShim } from '@/lib/monitoring/console-shim';

export type AuditAction =
  | 'CREATE_ORGANIZATION'
  | 'UPDATE_ORGANIZATION'
  | 'CREATE_POLICY'
  | 'UPDATE_POLICY'
  | 'DELETE_POLICY'
  | 'UPLOAD_DOCUMENT'
  | 'DELETE_DOCUMENT'
  | 'INVITE_USER'
  | 'REMOVE_USER'
  | 'UPDATE_USER_ROLE'
  | 'LOGIN_ATTEMPT'
  | 'EXPORT_DATA'
  | 'CREATE_TASK'
  | 'COMPLETE_TASK'
  | 'VERIFY_EVIDENCE';

export async function logActivityCore(
  organizationId: string,
  action: AuditAction,
  details: Record<string, unknown>,
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      consoleShim.warn(
        `[AUDIT SKIPPED] No authenticated user for action: ${action}`,
      );
      return;
    }

    // Audit 2026-05-26 — `details` is now `Record<string, unknown>` so
    // callers can't push arbitrary `any`-typed values into the audit
    // chain. The smart target-labeling below reads three optional
    // string fields; narrow at the use site rather than at the call.
    const targetCandidate =
      (details.resourceName as string | undefined) ??
      (details.documentName as string | undefined) ??
      (details.email as string | undefined) ??
      'System';

    // Insert into the ledger
    const { error } = await insertOrgAuditLog(supabase, {
      organization_id: organizationId,
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: action,
      target: targetCandidate,
      details,
    });

    if (error) {
      consoleShim.error(`[AUDIT FAILURE] DB rejected log: ${error.message}`);
    } else {
      rbacLogger.info('audit_event_recorded', { action, actorId: user.id });
    }
  } catch (err) {
    consoleShim.error(`[AUDIT CRASH] Logger failed:`, err);
  }
}
