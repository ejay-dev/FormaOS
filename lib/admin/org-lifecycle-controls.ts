import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

/**
 * Audit 2026-05-26 (M6 follow-up): this file used to reference a
 * non-existent `org_api_keys` table — the canonical table is
 * `api_keys`. Verified live against Care OS prod via
 * `information_schema.tables`. The mistyped name silently no-op'd
 * the API-key revoke step on org suspension and retirement, so
 * keys kept working after a founder pressed "Suspend." Fixed
 * inline; also migrated the per-org reads / writes to
 * createSupabaseOrgClient so future structural tenancy checks
 * cover this file.
 *
 * admin_audit_log stays on the raw admin client — it's a
 * platform-admin table, not org-scoped.
 */

type SuspendOptions = {
  reason: string;
  duration?: number; // days, null = indefinite
};

/**
 * Suspend an organization — blocks member sessions and API access.
 * Validates current state before proceeding.
 */
export async function suspendOrg(
  orgId: string,
  adminId: string,
  options: SuspendOptions,
) {
  const supabase = createSupabaseOrgClient(orgId);
  const admin = supabase.unsafeAdmin();

  const { data: org } = await supabase
    .from('organizations')
    .select('lifecycle_status, name')
    .single();

  if (!org) throw new Error('Organization not found');
  if (org.lifecycle_status === 'suspended')
    throw new Error('Organization is already suspended');
  if (org.lifecycle_status === 'retired')
    throw new Error('Cannot suspend a retired organization');

  const autoRestoreAt = options.duration
    ? new Date(
        Date.now() + options.duration * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  await supabase
    .from('organizations')
    .update({
      lifecycle_status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: options.reason,
      auto_restore_at: autoRestoreAt,
    });

  // Revoke active API keys (table is `api_keys`, not `org_api_keys`).
  await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .is('revoked_at', null);

  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'org_suspended',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: {
      reason: options.reason,
      duration: options.duration,
      auto_restore_at: autoRestoreAt,
      org_name: org.name,
    },
  });

  return { status: 'suspended', autoRestoreAt };
}

/**
 * Restore a suspended organization — re-enables all access.
 */
export async function restoreOrg(
  orgId: string,
  adminId: string,
  reason: string,
) {
  const supabase = createSupabaseOrgClient(orgId);
  const admin = supabase.unsafeAdmin();

  const { data: org } = await supabase
    .from('organizations')
    .select('lifecycle_status')
    .single();

  if (!org) throw new Error('Organization not found');
  if (org.lifecycle_status !== 'suspended')
    throw new Error('Can only restore suspended organizations');

  await supabase
    .from('organizations')
    .update({
      lifecycle_status: 'active',
      suspended_at: null,
      suspension_reason: null,
      auto_restore_at: null,
    });

  // Notify org admins. Audit v3-011 (2026-05-22): the canonical table is
  // `org_members` (1995 rows in prod). `org_memberships` exists with 0
  // rows — pre-fix this query returned 0 admins so the restore
  // notification was never delivered.
  const { data: orgAdmins } = await supabase
    .from('org_members')
    .select('user_id')
    .in('role', ['owner', 'admin']);

  for (const a of (orgAdmins ?? []) as Array<{ user_id: string }>) {
    await supabase.from('org_notifications').insert({
      user_id: a.user_id,
      type: 'org_restored',
      title: 'Organization Restored',
      message: 'Your organization access has been restored.',
    });
  }

  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'org_restored',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: { reason },
  });

  return { status: 'active' };
}

/**
 * Permanently retire an organization — cancels subscription, archives data, disables access.
 */
export async function retireOrg(
  orgId: string,
  adminId: string,
  reason: string,
) {
  const supabase = createSupabaseOrgClient(orgId);
  const admin = supabase.unsafeAdmin();

  const { data: org } = await supabase
    .from('organizations')
    .select('lifecycle_status')
    .single();

  if (!org) throw new Error('Organization not found');
  if (org.lifecycle_status === 'retired')
    throw new Error('Organization is already retired');

  await supabase
    .from('organizations')
    .update({
      lifecycle_status: 'retired',
      retired_at: new Date().toISOString(),
      retirement_reason: reason,
    });

  await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .is('revoked_at', null);

  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'org_retired',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: { reason },
  });

  return { status: 'retired' };
}

/**
 * Get org lifecycle event history from admin audit log.
 *
 * admin_audit_log is keyed by (resource_id, resource_type) rather
 * than an org column, so this stays on the raw admin client. The
 * caller's authz check (founder access) gates the operation.
 */
export async function getOrgLifecycleHistory(orgId: string) {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('admin_audit_log')
    .select('*')
    .eq('resource_id', orgId)
    .eq('resource_type', 'organization')
    .in('action', ['org_suspended', 'org_restored', 'org_retired'])
    .order('created_at', { ascending: false });
  return data ?? [];
}
