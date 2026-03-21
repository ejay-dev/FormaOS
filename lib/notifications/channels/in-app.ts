import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { NotificationEvent, NotificationRecord, NotificationUserContext } from '../types';
import {
  extractMissingSupabaseColumn,
  isMissingSupabaseTableError,
} from '@/lib/supabase/schema-compat';

async function insertLegacyNotification(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  recipient: NotificationUserContext,
  event: NotificationEvent,
  data: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = {
    organization_id: recipient.orgId,
    org_id: recipient.orgId,
    user_id: recipient.userId,
    type: event.type,
    title: event.title,
    body: event.body,
    message: event.body,
    data,
    metadata: data,
  };
  const optionalColumns = new Set([
    'organization_id',
    'org_id',
    'title',
    'body',
    'message',
    'data',
    'metadata',
  ]);

  for (;;) {
    const { data: legacyData, error } = await admin
      .from('org_notifications')
      .insert(payload)
      .select('*')
      .single();

    if (!error && legacyData) {
      return legacyData as Record<string, any>;
    }

    const missingColumn = extractMissingSupabaseColumn(error, 'org_notifications');
    if (missingColumn && optionalColumns.has(missingColumn) && missingColumn in payload) {
      optionalColumns.delete(missingColumn);
      delete payload[missingColumn];
      continue;
    }

    throw new Error(error?.message ?? 'Failed to create legacy notification');
  }
}

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

  if (!error && data) {
    return data as NotificationRecord;
  }

  if (!isMissingSupabaseTableError(error, 'notifications')) {
    throw new Error(error?.message ?? 'Failed to create in-app notification');
  }

  const legacyData = await insertLegacyNotification(
    admin,
    recipient,
    event,
    payload.data,
  );

  return {
    id: legacyData.id,
    org_id: legacyData.organization_id,
    user_id: legacyData.user_id,
    type: legacyData.type ?? event.type,
    title: legacyData.title ?? event.title,
    body: legacyData.message ?? event.body ?? null,
    data: (legacyData.metadata ?? payload.data ?? {}) as NotificationRecord['data'],
    priority: event.priority ?? 'normal',
    read_at: legacyData.read_at ?? null,
    archived_at: null,
    created_at: legacyData.created_at ?? new Date().toISOString(),
  } satisfies NotificationRecord;
}
