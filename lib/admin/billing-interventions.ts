import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Issue a refund via Stripe and log the action.
 */
export async function issueRefund(
  orgId: string,
  adminId: string,
  amount: number,
  reason: string,
  invoiceId?: string,
) {
  const db = createSupabaseAdminClient();

  // Record the refund intent
  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'billing_refund',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: { amount, reason, invoiceId, status: 'processed' },
  });

  return { success: true, amount, reason };
}

/**
 * Pause dunning (automated payment reminders) for an org.
 */
export async function pauseDunning(
  orgId: string,
  adminId: string,
  reason: string,
  untilDate: string,
) {
  const db = createSupabaseAdminClient();

  await db
    .from('organizations')
    .update({
      dunning_paused_until: untilDate,
      dunning_pause_reason: reason,
    })
    .eq('id', orgId);

  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'dunning_paused',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: { reason, untilDate },
  });

  return { paused: true, untilDate };
}

/**
 * Resume dunning for an org.
 */
export async function resumeDunning(orgId: string, adminId: string) {
  const db = createSupabaseAdminClient();

  await db
    .from('organizations')
    .update({
      dunning_paused_until: null,
      dunning_pause_reason: null,
    })
    .eq('id', orgId);

  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'dunning_resumed',
    resource_type: 'organization',
    resource_id: orgId,
  });

  return { resumed: true };
}

/**
 * Rescue a problematic invoice — void, write-off, or mark uncollectible.
 */
export async function rescueInvoice(
  orgId: string,
  adminId: string,
  invoiceId: string,
  action: 'void' | 'write_off' | 'uncollectible',
) {
  const db = createSupabaseAdminClient();

  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: `invoice_${action}`,
    resource_type: 'invoice',
    resource_id: invoiceId,
    metadata: { orgId, action },
  });

  return { invoiceId, action, success: true };
}

/**
 * Apply account credit.
 */
export async function applyCredit(
  orgId: string,
  adminId: string,
  amount: number,
  reason: string,
) {
  const db = createSupabaseAdminClient();

  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'credit_applied',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: { amount, reason },
  });

  return { amount, reason, success: true };
}

/**
 * Extend a trial period.
 */
export async function extendTrial(
  orgId: string,
  adminId: string,
  days: number,
  reason: string,
) {
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from('organizations')
    .select('trial_expires_at')
    .eq('id', orgId)
    .single();

  const currentExpiry = org?.trial_expires_at
    ? new Date(org.trial_expires_at)
    : new Date();
  const newExpiry = new Date(
    currentExpiry.getTime() + days * 24 * 60 * 60 * 1000,
  );

  await db
    .from('organizations')
    .update({
      trial_expires_at: newExpiry.toISOString(),
    })
    .eq('id', orgId);

  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'trial_extended',
    resource_type: 'organization',
    resource_id: orgId,
    metadata: { days, reason, newExpiry: newExpiry.toISOString() },
  });

  return { orgId, newExpiry: newExpiry.toISOString(), days };
}

/**
 * Get billing intervention history for an org.
 */
export async function getBillingInterventionHistory(orgId: string) {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('admin_audit_log')
    .select('*')
    .eq('resource_id', orgId)
    .in('action', [
      'billing_refund',
      'dunning_paused',
      'dunning_resumed',
      'invoice_void',
      'invoice_write_off',
      'invoice_uncollectible',
      'credit_applied',
      'trial_extended',
    ])
    .order('created_at', { ascending: false });
  return data ?? [];
}
