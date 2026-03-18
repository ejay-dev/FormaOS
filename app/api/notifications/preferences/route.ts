import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  type NotificationChannelType,
  type NotificationDigestFrequency,
  type NotificationEventType,
} from '@/lib/notifications/types';
import { requireNotificationContext } from '@/lib/notifications/server';

function createDefaultPreferences(userId: string, orgId: string) {
  return NOTIFICATION_EVENT_TYPES.flatMap((eventType) =>
    NOTIFICATION_CHANNELS.map((channel) => ({
      user_id: userId,
      org_id: orgId,
      channel,
      event_type: eventType,
      enabled: channel === 'in_app' || channel === 'email',
      digest_frequency: channel === 'email' ? 'daily' : 'instant',
      quiet_hours: {},
    })),
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await requireNotificationContext(searchParams.get('orgId'));

    const { data, error } = await context.supabase
      .from('notification_preferences')
      .select(
        'id, user_id, org_id, channel, event_type, enabled, digest_frequency, quiet_hours',
      )
      .eq('user_id', context.user.id)
      .eq('org_id', context.orgId)
      .order('event_type', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      preferences:
        data && data.length
          ? data
          : createDefaultPreferences(context.user.id, context.orgId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load preferences' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      orgId?: string;
      quietHours?: Record<string, unknown>;
      preferences?: Array<{
        channel: NotificationChannelType;
        eventType: NotificationEventType;
        enabled: boolean;
        digestFrequency?: NotificationDigestFrequency;
      }>;
    };
    const context = await requireNotificationContext(body.orgId ?? null);
    const admin = createSupabaseAdminClient();

    const rows = (body.preferences ?? []).map((preference) => ({
      user_id: context.user.id,
      org_id: context.orgId,
      channel: preference.channel,
      event_type: preference.eventType,
      enabled: preference.enabled,
      digest_frequency:
        preference.digestFrequency ??
        (preference.channel === 'email' ? 'daily' : 'instant'),
      quiet_hours: body.quietHours ?? {},
      updated_at: new Date().toISOString(),
    }));

    if (!rows.length) {
      return NextResponse.json({ updated: 0 });
    }

    const { error } = await admin.from('notification_preferences').upsert(rows, {
      onConflict: 'user_id,org_id,channel,event_type',
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ updated: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save preferences' },
      { status: 500 },
    );
  }
}
