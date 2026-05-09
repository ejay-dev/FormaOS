/**
 * MFA event audit logging.
 *
 * Writes to the existing `activity_logs` stream via `logActivity` so MFA
 * events surface alongside other auth events on the audit dashboard.
 * `organization_id` is best-effort — MFA events happen before the user
 * has a resolved org context, so we look up the primary membership and
 * fall back to a sentinel value if none exists.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('lib/auth/mfa-audit');

export type MfaAuditEvent =
  | 'mfa_required'
  | 'mfa_success'
  | 'mfa_failure'
  | 'mfa_backup_code_used';

export type MfaAuditMethod = 'password' | 'oauth';

export interface MfaAuditPayload {
  userId: string;
  event: MfaAuditEvent;
  method: MfaAuditMethod;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string;
}

const ORG_FALLBACK = '00000000-0000-0000-0000-000000000000';

async function resolveOrgId(userId: string): Promise<string> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return (data?.organization_id as string | undefined) ?? ORG_FALLBACK;
  } catch (err) {
    log.warn({ err }, 'failed to resolve org for MFA audit');
    return ORG_FALLBACK;
  }
}

/**
 * Persist an MFA audit row. Failures are swallowed: we never want to
 * surface "could not write audit log" to a user who is correctly
 * being held at the MFA challenge.
 */
export async function logMfaAudit(payload: MfaAuditPayload): Promise<void> {
  const orgId = await resolveOrgId(payload.userId);

  try {
    const admin = createSupabaseAdminClient();
    await admin.from('activity_logs').insert({
      organization_id: orgId,
      user_id: payload.userId,
      action: 'login',
      entity_type: 'auth',
      entity_id: payload.userId,
      entity_name: payload.event,
      details: {
        mfa_event: payload.event,
        method: payload.method,
        status:
          payload.event === 'mfa_success' ||
          payload.event === 'mfa_backup_code_used'
            ? 'success'
            : 'failed',
        reason: payload.reason,
      },
      ip_address: payload.ipAddress ?? undefined,
      user_agent: payload.userAgent ?? undefined,
    });
  } catch (err) {
    log.error({ err, event: payload.event }, 'mfa audit write failed');
  }
}
