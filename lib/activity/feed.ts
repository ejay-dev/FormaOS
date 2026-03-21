import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ActivityFeedRecord } from '@/lib/notifications/types';
import {
  isMissingSupabaseTableError,
} from '@/lib/supabase/schema-compat';

export interface ActivityResourceInput {
  type: string;
  id?: string | null;
  name?: string | null;
  path?: string | null;
}

export interface ActivityFeedFilters {
  action?: string;
  actorId?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ActivityFeedQuery {
  cursor?: string | null;
  limit?: number;
  filters?: ActivityFeedFilters;
}

function encodeCursor(record: Pick<ActivityFeedRecord, 'created_at' | 'id'>) {
  return Buffer.from(`${record.created_at}::${record.id}`, 'utf8').toString(
    'base64',
  );
}

function decodeCursor(cursor?: string | null) {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const [createdAt, id] = decoded.split('::');
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

async function resolveActor(actorId?: string | null) {
  if (!actorId) {
    return {
      actor_email: 'system@formaos.com',
      actor_name: 'System',
    };
  }

  const admin = createSupabaseAdminClient();
  const [{ data: profile }, authResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', actorId)
      .maybeSingle(),
    admin.auth.admin.getUserById(actorId),
  ]);

  return {
    actor_email: authResult.data.user?.email ?? null,
    actor_name: (profile?.full_name as string | null | undefined) ?? null,
  };
}

export async function logActivity(
  orgId: string,
  actorId: string | null,
  action: string,
  resource: ActivityResourceInput,
  metadata: Record<string, unknown> = {},
) {
  const admin = createSupabaseAdminClient();
  const actor = await resolveActor(actorId);

  const { data, error } = await admin
    .from('activity_feed')
    .insert({
      org_id: orgId,
      actor_id: actorId,
      actor_email: actor.actor_email,
      actor_name: actor.actor_name,
      action,
      resource_type: resource.type,
      resource_id: resource.id ?? null,
      resource_name: resource.name ?? null,
      metadata: {
        ...metadata,
        path: resource.path ?? metadata.path ?? null,
      },
    })
    .select(
      'id, org_id, actor_id, actor_email, actor_name, action, resource_type, resource_id, resource_name, metadata, created_at',
    )
    .single();

  if (error) {
    if (isMissingSupabaseTableError(error, 'activity_feed')) {
      return null;
    }
    throw new Error(error.message);
  }

  return data as ActivityFeedRecord;
}

export async function getActivityFeed(orgId: string, options: ActivityFeedQuery = {}) {
  const admin = createSupabaseAdminClient();
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const cursor = decodeCursor(options.cursor);

  let query = admin
    .from('activity_feed')
    .select(
      'id, org_id, actor_id, actor_email, actor_name, action, resource_type, resource_id, resource_name, metadata, created_at',
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (options.filters?.action) {
    query = query.eq('action', options.filters.action);
  }
  if (options.filters?.actorId) {
    query = query.eq('actor_id', options.filters.actorId);
  }
  if (options.filters?.resourceType) {
    query = query.eq('resource_type', options.filters.resourceType);
  }
  if (options.filters?.dateFrom) {
    query = query.gte('created_at', options.filters.dateFrom);
  }
  if (options.filters?.dateTo) {
    query = query.lte('created_at', options.filters.dateTo);
  }
  if (cursor) {
    query = query.lt('created_at', cursor.createdAt);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingSupabaseTableError(error, 'activity_feed')) {
      return {
        items: [],
        nextCursor: null,
      };
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ActivityFeedRecord[];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
  };
}

export async function getResourceActivity(
  orgId: string,
  resourceType: string,
  resourceId: string,
) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('activity_feed')
    .select(
      'id, org_id, actor_id, actor_email, actor_name, action, resource_type, resource_id, resource_name, metadata, created_at',
    )
    .eq('org_id', orgId)
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingSupabaseTableError(error, 'activity_feed')) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as ActivityFeedRecord[];
}

export async function getUserActivity(orgId: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('activity_feed')
    .select(
      'id, org_id, actor_id, actor_email, actor_name, action, resource_type, resource_id, resource_name, metadata, created_at',
    )
    .eq('org_id', orgId)
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingSupabaseTableError(error, 'activity_feed')) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as ActivityFeedRecord[];
}
