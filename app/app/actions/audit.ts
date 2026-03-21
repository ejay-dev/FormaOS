'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rbacLogger } from '@/lib/observability/structured-logger';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';

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
  | 'LOGIN_ATTEMPT'
  | 'EXPORT_DATA'
  | 'CREATE_TASK'
  | 'COMPLETE_TASK'
  | 'VERIFY_EVIDENCE';

/**
 * ✅ CENTRALIZED AUDIT LOGGER
 * Call this from ANY server action to record an event.
 * It fails silently (console error) so it doesn't block the user's main action.
 */
export async function logActivity(
  organizationId: string,
  action: AuditAction,
  details: Record<string, any>,
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn(
        `[AUDIT SKIPPED] No authenticated user for action: ${action}`,
      );
      return;
    }

    // Insert into the ledger
    const { error } = await insertOrgAuditLog(supabase, {
      organization_id: organizationId,
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: action,
      // Smart resource labeling based on details
      target:
        details.resourceName ||
        details.documentName ||
        details.email ||
        'System',
      details,
    });

    if (error) {
      console.error(`[AUDIT FAILURE] DB rejected log: ${error.message}`);
    } else {
      rbacLogger.info('audit_event_recorded', { action, actorId: user.id });
    }
  } catch (err) {
    console.error(`[AUDIT CRASH] Logger failed:`, err);
  }
}
