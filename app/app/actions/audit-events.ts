"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { getUserOrgMembership } from '@/app/app/actions/rbac';

type AuditEventInput = {
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

type AuditEventOptions = {
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

export async function logAuditEvent(
  payload: AuditEventInput,
  options: AuditEventOptions = {},
) {
  const required = options.required === true;

  // Audit server-actions-003 (2026-05-22): this function was forgeable
  // — any authenticated user could call it from a hostile client and
  // inject events tagged to a victim org with a spoofed actor identity.
  // The admin-client fallback below made the forgery RLS-proof. Gate
  // here on the caller's session-derived org membership before any
  // write — and only allow the admin fallback after that check passes.
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

  const supabase = await createSupabaseServerClient();
  try {
    const entityLabel = payload.entityType
      ? `${payload.entityType}${payload.entityId ? `:${payload.entityId}` : ""}`
      : "system";

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
      domain: "compliance",
      severity: "low",
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
      console.warn('[Audit] org audit log required service-role fallback', {
        action: payload.actionType,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        error: toAuditWriteError(serverResult.error),
      });
      return { success: true as const };
    }

    const errorMessage = toAuditWriteError(adminResult.error);
    console.error('[Audit] org audit log write failed', {
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
    console.error('[Audit] org audit log unexpected failure', {
      action: payload.actionType,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      error: toAuditWriteError(error),
    });
    return { success: false as const, error: toAuditWriteError(error) };
  }
}
