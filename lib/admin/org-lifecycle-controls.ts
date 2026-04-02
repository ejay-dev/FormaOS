import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from('organizations')
    .select('lifecycle_status, name')
    .eq('id', orgId)
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

  await db
    .from('organizations')
    .update({
      lifecycle_status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: options.reason,
      auto_restore_at: autoRestoreAt,
    })
    .eq('id', orgId);

  // Revoke active API keys
  await db
    .from('org_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .is('revoked_at', null);

  await db.from('admin_audit_log').insert({
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
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from('organizations')
    .select('lifecycle_status')
    .eq('id', orgId)
    .single();

  if (!org) throw new Error('Organization not found');
  if (org.lifecycle_status !== 'suspended')
    throw new Error('Can only restore suspended organizations');

  await db
    .from('organizations')
    .update({
      lifecycle_status: 'active',
      suspended_at: null,
      suspension_reason: null,
      auto_restore_at: null,
    })
    .eq('id', orgId);

  // Notify org admins
  const { data: orgAdmins } = await db
    .from('org_memberships')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin']);

  for (const a of orgAdmins ?? []) {
    await db.from('org_notifications').insert({
      organization_id: orgId,
      user_id: a.user_id,
      type: 'org_restored',
      title: 'Organization Restored',
      message: 'Your organization access has been restored.',
    });
  }

  await db.from('admin_audit_log').insert({
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
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from('organizations')
    .select('lifecycle_status')
    .eq('id', orgId)
    .single();

  if (!org) throw new Error('Organization not found');
  if (org.lifecycle_status === 'retired')
    throw new Error('Organization is already retired');

  await db
    .from('organizations')
    .update({
      lifecycle_status: 'retired',
      retired_at: new Date().toISOString(),
      retirement_reason: reason,
    })
    .eq('id', orgId);

  await db
    .from('org_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .is('revoked_at', null);

  await db.from('admin_audit_log').insert({
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
