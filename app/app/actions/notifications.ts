'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Canonical input type
 */
type CreateNotificationInput = {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
};

/**
 * 🔒 ADMIN / SYSTEM: Create notification for any user in org
 * Enforces:
 * - Membership & role
 * - User notification preferences
 * - Type-level opt-outs
 */
export async function createNotification(input: CreateNotificationInput) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  /* 1️⃣ Check caller membership & role */
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', input.organizationId)
    .single();

  if (membershipError || !membership) {
    throw new Error('Access denied: not a member of this organization');
  }

  if (!['admin', 'manager', 'owner'].includes(membership.role)) {
    throw new Error('Forbidden: insufficient privileges');
  }

  const { data: recipientMembership, error: recipientError } = await supabase
    .from('org_members')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('user_id', input.userId)
    .maybeSingle();

  if (recipientError || !recipientMembership) {
    throw new Error('Recipient not in organization');
  }

  /* 2️⃣ Load recipient notification preferences */
  const { data: prefs, error: prefsError } = await supabase
    .from('org_notification_prefs')
    .select('*')
    .eq('user_id', input.userId)
    .single();

  if (prefsError || !prefs) {
    // Fail silently, never block core system logic because of prefs
    return { skipped: true, reason: 'No preferences found' };
  }

  /* 3️⃣ Global in-app kill switch */
  if (!prefs.in_app_enabled) {
    return { skipped: true, reason: 'In-app notifications disabled' };
  }

  /* 4️⃣ Type-level preference enforcement */
  const typeMap: Record<string, boolean> = {
    POLICY_CREATED: prefs.policy_updates,
    POLICY_UPDATED: prefs.policy_updates,
    EVIDENCE_LINKED: prefs.evidence_updates,
    TASK_CREATED: prefs.task_updates,
    TASK_COMPLETED: prefs.task_updates,
    TASK_RECURRING: prefs.task_updates,
    TASK_GATE_BLOCKED: prefs.security_updates,
    SECURITY_ALERT: prefs.security_updates,
  };

  if (typeMap[input.type] === false) {
    return {
      skipped: true,
      reason: 'User opted out of this notification type',
    };
  }

  /* 5️⃣ Insert notification */
  const { error } = await supabase.from('org_notifications').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body || null,
    action_url: input.actionUrl || null,
    metadata: input.metadata || {},
  });

  if (error) throw error;

  return { success: true };
}

/**
 * 🔐 USER: Mark a single notification as read
 */
export async function markNotificationRead(id: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership?.organization_id) {
    throw new Error('Organization context lost');
  }

  const { error } = await supabase
    .from('org_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('organization_id', membership.organization_id);

  if (error) throw error;

  return { success: true };
}

/**
 * 🔐 USER: Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership?.organization_id) {
    throw new Error('Organization context lost');
  }

  const { error } = await supabase
    .from('org_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('organization_id', membership.organization_id)
    .is('read_at', null);

  if (error) throw error;

  return { success: true };
}

/**
 * ✅ SAFE DEFAULT: Notify only the currently authenticated user
 * - Does NOT require admin role
 * - Still respects user preferences
 */
export async function notifySelf(params: {
  organizationId: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  /* Load preferences */
  const { data: prefs } = await supabase
    .from('org_notification_prefs')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!prefs || !prefs.in_app_enabled) {
    return { skipped: true };
  }

  const typeMap: Record<string, boolean> = {
    POLICY_CREATED: prefs.policy_updates,
    POLICY_UPDATED: prefs.policy_updates,
    EVIDENCE_LINKED: prefs.evidence_updates,
    TASK_CREATED: prefs.task_updates,
    TASK_COMPLETED: prefs.task_updates,
    TASK_RECURRING: prefs.task_updates,
    TASK_GATE_BLOCKED: prefs.security_updates,
    SECURITY_ALERT: prefs.security_updates,
  };

  if (typeMap[params.type] === false) {
    return { skipped: true };
  }

  const { error } = await supabase.from('org_notifications').insert({
    organization_id: params.organizationId,
    user_id: user.id,
    type: params.type,
    title: params.title,
    body: params.body || null,
    action_url: params.actionUrl || null,
    metadata: params.metadata || {},
  });

  if (error) throw error;

  return { success: true };
}
