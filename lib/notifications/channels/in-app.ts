import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { NotificationEvent, NotificationRecord, NotificationUserContext } from '../types';

export async function createInAppNotification(
  recipient: NotificationUserContext,
  event: NotificationEvent,
) {
  const admin = createSupabaseAdminClient();
  const payload = {
    org_id: recipient.orgId,
    user_id: recipient.userId,
    type: event.type,
    title: event.title,
    body: event.body,
    data: {
      ...(event.data ?? {}),
      dedupeKey:
        event.dedupeKey ??
        (typeof event.data?.dedupeKey === 'string'
          ? event.data.dedupeKey
          : undefined),
    },
    priority: event.priority ?? 'normal',
    dedupe_key:
      event.dedupeKey ??
      (typeof event.data?.dedupeKey === 'string'
        ? event.data.dedupeKey
        : null),
  };

  const { data, error } = await admin
    .from('notifications')
    .insert(payload)
    .select(
      'id, org_id, user_id, type, title, body, data, priority, read_at, archived_at, created_at',
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as NotificationRecord;
}
