import { NextResponse } from 'next/server';
import { notify } from '@/lib/notifications/engine';
import {
  EVENT_CATEGORY_MAP,
  EVENT_LABELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationCategory,
  type NotificationEventType,
} from '@/lib/notifications/types';
import {
  decodeCursor,
  encodeCursor,
  requireNotificationContext,
} from '@/lib/notifications/server';

function eventTypesForCategory(category?: string | null) {
  if (!category) return null;

  return Object.entries(EVENT_CATEGORY_MAP)
    .filter(([, value]) => value === category)
    .map(([key]) => key) as NotificationEventType[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await requireNotificationContext(searchParams.get('orgId'));
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit') ?? '25') || 25, 1),
      100,
    );
    const cursor = decodeCursor(searchParams.get('cursor'));
    const unreadOnly = searchParams.get('unread') === 'true';
    const archived = searchParams.get('archived') === 'true';
    const category = searchParams.get('category') as NotificationCategory | null;

    let query = context.supabase
      .from('notifications')
      .select(
        'id, org_id, user_id, type, title, body, data, priority, read_at, archived_at, created_at',
      )
      .eq('org_id', context.orgId)
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (!archived) {
      query = query.is('archived_at', null);
    }

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const filteredTypes = eventTypesForCategory(category);
    if (filteredTypes?.length) {
      query = query.in('type', filteredTypes);
    }

    if (cursor) {
      query = query.lt('created_at', cursor.createdAt);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      items,
      nextCursor: hasMore ? encodeCursor(items[items.length - 1] as any) : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load notifications',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          orgId?: string;
          ids?: string[];
          action?: 'mark_read' | 'mark_all_read' | 'archive';
        }
      | null;
    const context = await requireNotificationContext(body?.orgId ?? null);
    const ids = Array.isArray(body?.ids)
      ? body!.ids.filter((value): value is string => typeof value === 'string')
      : [];

    if (!body?.action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let query = context.supabase
      .from('notifications')
      .update(
        body.action === 'archive'
          ? { archived_at: new Date().toISOString() }
          : { read_at: new Date().toISOString() },
      )
      .eq('org_id', context.orgId)
      .eq('user_id', context.user.id);

    if (body.action !== 'mark_all_read') {
      if (!ids.length) {
        return NextResponse.json({ error: 'ids are required' }, { status: 400 });
      }
      query = query.in('id', ids);
    } else {
      query = query.is('read_at', null);
    }

    const { data, error } = await query.select('id');
    if (error) {
      throw error;
    }

    return NextResponse.json({ updated: data?.length ?? 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { orgId?: string; eventType?: NotificationEventType; priority?: string }
      | null;
    const context = await requireNotificationContext(body?.orgId ?? null);
    const eventType =
      body?.eventType && NOTIFICATION_EVENT_TYPES.includes(body.eventType)
        ? body.eventType
        : 'system.release';

    const priority =
      body?.priority === 'critical' ||
      body?.priority === 'high' ||
      body?.priority === 'low'
        ? body.priority
        : 'normal';

    const label = EVENT_LABELS[eventType];

    const result = await notify(context.orgId, [context.user.id], {
      type: eventType,
      title: `Test: ${label}`,
      body: `This is a ${priority} test notification for ${label.toLowerCase()}.`,
      priority,
      data: {
        href: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/app/settings/notifications`,
        resourceType: 'notification_test',
      },
      dedupeWindowMinutes: 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test send failed' },
      { status: 500 },
    );
  }
}
