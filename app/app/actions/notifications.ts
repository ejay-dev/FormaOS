'use server';

import { notify } from '@/lib/notifications/engine';
import type { NotificationEventType } from '@/lib/notifications/types';
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

const LEGACY_EVENT_MAP: Record<string, NotificationEventType> = {
  POLICY_CREATED: 'system.release',
  POLICY_UPDATED: 'system.release',
  EVIDENCE_LINKED: 'evidence.review_requested',
  TASK_CREATED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_RECURRING: 'task.assigned',
  TASK_GATE_BLOCKED: 'compliance.gap_detected',
  SECURITY_ALERT: 'system.security_alert',
};

function mapLegacyType(type: string): NotificationEventType {
  return LEGACY_EVENT_MAP[type] ?? 'system.release';
}

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
    .maybeSingle();

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

  await notify(input.organizationId, [input.userId], {
    type: mapLegacyType(input.type),
    title: input.title,
    body: input.body || '',
    data: {
      ...(input.metadata ?? {}),
      href: input.actionUrl,
      dedupeKey:
        typeof input.metadata?.dedupeKey === 'string'
          ? input.metadata.dedupeKey
          : `${input.type}:${input.userId}:${input.actionUrl ?? ''}`,
    },
    priority: input.type === 'SECURITY_ALERT' ? 'critical' : 'normal',
  });

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
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('org_id', membership.organization_id);

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
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('org_id', membership.organization_id)
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

  await notify(params.organizationId, [user.id], {
    type: mapLegacyType(params.type),
    title: params.title,
    body: params.body || '',
    data: {
      ...(params.metadata ?? {}),
      href: params.actionUrl,
      dedupeKey:
        typeof params.metadata?.dedupeKey === 'string'
          ? params.metadata.dedupeKey
          : `${params.type}:${user.id}:${params.actionUrl ?? ''}`,
    },
    priority: params.type === 'SECURITY_ALERT' ? 'critical' : 'normal',
  });

  return { success: true };
}
