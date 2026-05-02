import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/dashboard/recent-activity');

export interface RecentActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityName: string | null;
  entityId: string | null;
  createdAt: string;
  actor: {
    userId: string;
    name: string | null;
    avatarPath: string | null;
  } | null;
}

export interface RecentActivityResponse {
  items: RecentActivityItem[];
}

/**
 * GET /api/dashboard/recent-activity
 * Returns the last 8 activity log entries for the current user's organization,
 * shaped for the dashboard activity feed widget.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = membership?.organization_id;
    if (!orgId) {
      return NextResponse.json({ items: [] });
    }

    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select(
        'id, user_id, action, entity_type, entity_id, entity_name, created_at',
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (logsError) {
      log.error({ err: logsError }, 'failed to fetch activity_logs');
      return NextResponse.json({ items: [] });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const userIds = Array.from(
      new Set(
        logs.map((l: { user_id: string | null }) => l.user_id).filter(Boolean),
      ),
    ) as string[];

    let profileMap = new Map<
      string,
      { full_name: string | null; avatar_path: string | null }
    >();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_path')
        .in('user_id', userIds);

      if (profiles) {
        profileMap = new Map(
          (
            profiles as Array<{
              user_id: string;
              full_name: string | null;
              avatar_path: string | null;
            }>
          ).map((p) => [
            p.user_id,
            { full_name: p.full_name, avatar_path: p.avatar_path },
          ]),
        );
      }
    }

    const items: RecentActivityItem[] = logs.map(
      (l: {
        id: string;
        user_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        entity_name: string | null;
        created_at: string;
      }) => {
        const profile = l.user_id ? profileMap.get(l.user_id) : null;
        return {
          id: l.id,
          action: l.action,
          entityType: l.entity_type,
          entityName: l.entity_name ?? null,
          entityId: l.entity_id ?? null,
          createdAt: l.created_at,
          actor: l.user_id
            ? {
                userId: l.user_id,
                name: profile?.full_name ?? null,
                avatarPath: profile?.avatar_path ?? null,
              }
            : null,
        };
      },
    );

    return NextResponse.json({ items });
  } catch (err) {
    log.error({ err }, 'recent-activity unexpected error');
    return NextResponse.json({ items: [] });
  }
}
