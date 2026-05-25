import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/audit-engine";
import { consoleShim } from '@/lib/monitoring/console-shim';

export type AdminAuditEntry = {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  /**
   * Optional. When provided, the admin action is ALSO chained into the
   * per-org hash-chained audit trail via lib/audit/audit-engine. Without
   * it the action lands only in admin_audit_log + audit_log (legacy
   * columns), which means per-tenant audit exports can't include it.
   * Pass `orgId` whenever the action targets a specific organisation
   * (e.g. founder editing an org's subscription, suspending an account).
   *
   * Audit 2026-05-23: starting point for the audit-log writer
   * consolidation. Existing callers don't pass it (behaviour unchanged).
   * New/refactored callers that touch an org should pass it.
   */
  orgId?: string;
};

export async function logAdminAction(entry: AdminAuditEntry) {
  const admin = createSupabaseAdminClient();
  const environment =
    process.env.VERCEL_ENV === 'production'
      ? 'production'
      : process.env.VERCEL_ENV === 'preview'
        ? 'preview'
        : 'development';
  const metadata = {
    ...(entry.metadata ?? {}),
    environment,
  };

  // v4-027: previously Promise.all — if the first insert rejected,
  // the second's outcome was abandoned (Node treats further rejections
  // as silent if the surrounding promise has already rejected). The
  // admin audit trail then lost the row in the other table without
  // surfacing the failure. Use Promise.allSettled so both writes run
  // to completion, log every failure, and bubble up an error only if
  // BOTH writes failed (so the caller can react but partial success
  // still records what it can).
  const results = await Promise.allSettled([
    admin.from('admin_audit_log').insert({
      actor_user_id: entry.actorUserId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      metadata,
    }),
    admin.from('audit_log').insert({
      actor_user_id: entry.actorUserId,
      event_type: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      environment,
      metadata,
    }),
  ]);

  const failures: string[] = [];
  results.forEach((result, idx) => {
    const tableName = idx === 0 ? 'admin_audit_log' : 'audit_log';
    if (result.status === 'rejected') {
      failures.push(`${tableName}: ${result.reason}`);
    } else if ((result.value as { error?: { message?: string } })?.error) {
      failures.push(
        `${tableName}: ${(result.value as { error: { message?: string } }).error.message ?? 'insert failed'}`,
      );
    }
  });

  if (failures.length === results.length) {
    // Both writes failed — surface to the caller so the admin action
    // can be retried / surfaced in the UI. Partial success (1 of 2)
    // is logged but doesn't throw.
    throw new Error(`logAdminAction: all writes failed — ${failures.join('; ')}`);
  }
  if (failures.length > 0) {
    consoleShim.warn('[admin.audit] partial write failure:', failures.join('; '));
  }

  // Audit 2026-05-23: when the caller knows which org the action targets,
  // also chain into the per-org hash-chained audit_log via the engine.
  // This is additive — admin_audit_log + legacy audit_log remain the
  // authoritative records, and a hash-chain write failure is logged but
  // doesn't fail the call (otherwise an unrelated hash issue would break
  // every admin action).
  if (entry.orgId) {
    try {
      await writeAuditLog(entry.orgId, {
        userId: entry.actorUserId,
        action: entry.action,
        resourceType: entry.targetType,
        resourceId: entry.targetId,
        details: metadata,
      });
    } catch (err) {
      consoleShim.warn(
        '[admin.audit] hash-chain write failed:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
