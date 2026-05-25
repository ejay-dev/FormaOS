/**
 * Audit server-actions-003 (2026-05-22): lib-level core for audit event
 * writes. Does NOT verify caller authz — the server-action wrapper at
 * `@/app/app/actions/audit-events` enforces the session→orgId match
 * before delegating here. Calling this directly skips that wrapper, so
 * only do so from server-only code paths that already have a trusted
 * orgId (background workers, system-initiated flows). The admin-client
 * fallback below is RLS-bypassing and is only safe AFTER the caller has
 * verified it owns `payload.organizationId`.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { consoleShim } from '@/lib/monitoring/console-shim';

export type AuditEventInput = {
  organizationId: string;
  actorUserId: string | null;
  actorRole: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionType: string;
  beforeState?: any;
  afterState?: any;
  reason?: string | null;
};

export type AuditEventOptions = {
  required?: boolean;
};

function toAuditWriteError(error: unknown) {
  if (!error) return 'Unknown audit write failure';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
}

export async function logAuditEventCore(
  payload: AuditEventInput,
  options: AuditEventOptions = {},
) {
  const required = options.required === true;
  const supabase = await createSupabaseServerClient();
  try {
    const entityLabel = payload.entityType
      ? `${payload.entityType}${payload.entityId ? `:${payload.entityId}` : ''}`
      : 'system';

    const row = {
      organization_id: payload.organizationId,
      actor_id: payload.actorUserId,
      actor_email: null,
      action: payload.actionType,
      // target stays for back-compat; entity_type/entity_id are the
      // structured columns the reader now prefers (see migration
      // 20260430_006_audit_log_entity_typed_columns.sql).
      target: entityLabel,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      domain: 'compliance',
      severity: 'low',
      metadata: {
        actor_role: payload.actorRole ?? null,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
        before_state: payload.beforeState ?? null,
        after_state: payload.afterState ?? null,
        reason: payload.reason ?? null,
      },
      created_at: new Date().toISOString(),
    };

    const serverResult = await insertOrgAuditLog(supabase, row);
    if (!serverResult.error) {
      return { success: true as const };
    }

    const admin = createSupabaseAdminClient();
    const adminResult = await insertOrgAuditLog(admin, row);
    if (!adminResult.error) {
      consoleShim.warn('[Audit] org audit log required service-role fallback', {
        action: payload.actionType,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        error: toAuditWriteError(serverResult.error),
      });
      return { success: true as const };
    }

    const errorMessage = toAuditWriteError(adminResult.error);
    consoleShim.error('[Audit] org audit log write failed', {
      action: payload.actionType,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      error: errorMessage,
    });

    if (required) {
      throw new Error(`Required audit log write failed: ${errorMessage}`);
    }

    return { success: false as const, error: errorMessage };
  } catch (error) {
    if (required) throw error;
    consoleShim.error('[Audit] org audit log unexpected failure', {
      action: payload.actionType,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      error: toAuditWriteError(error),
    });
    return { success: false as const, error: toAuditWriteError(error) };
  }
}
