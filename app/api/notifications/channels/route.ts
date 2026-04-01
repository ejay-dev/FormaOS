import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireNotificationContext } from '@/lib/notifications/server';
import type { NotificationChannelType } from '@/lib/notifications/types';
import { validateCsrfOrigin } from '@/lib/security/csrf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const context = await requireNotificationContext(searchParams.get('orgId'));

    const { data, error } = await context.supabase
      .from('notification_channels')
      .select('id, user_id, org_id, channel_type, config, verified, created_at')
      .eq('user_id', context.user.id)
      .eq('org_id', context.orgId)
      .order('channel_type', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ channels: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load channels' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = (await request.json()) as {
      orgId?: string;
      channelType: NotificationChannelType;
      config: Record<string, unknown>;
      verified?: boolean;
    };
    const context = await requireNotificationContext(body.orgId ?? null);
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('notification_channels')
      .upsert(
        {
          user_id: context.user.id,
          org_id: context.orgId,
          channel_type: body.channelType,
          config: body.config ?? {},
          verified: body.verified ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,org_id,channel_type' },
      )
      .select('id, user_id, org_id, channel_type, config, verified, created_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ channel: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save channel' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { orgId?: string; channelType?: NotificationChannelType }
      | null;
    const context = await requireNotificationContext(body?.orgId ?? null);

    if (!body?.channelType) {
      return NextResponse.json(
        { error: 'channelType is required' },
        { status: 400 },
      );
    }

    const { error } = await context.supabase
      .from('notification_channels')
      .delete()
      .eq('user_id', context.user.id)
      .eq('org_id', context.orgId)
      .eq('channel_type', body.channelType);

    if (error) {
      throw error;
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete channel' },
      { status: 500 },
    );
  }
}
