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
      .from('org_audit_logs')
      .select('id, action, target, entity_type, entity_id, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (logsError) {
      log.error({ err: logsError }, 'failed to fetch org_audit_logs');
      return NextResponse.json({ items: [] });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const items: RecentActivityItem[] = logs.map(
      (l: {
        id: string;
        action: string;
        target: string;
        entity_type: string | null;
        entity_id: string | null;
        created_at: string;
      }) => {
        return {
          id: l.id,
          action: l.action,
          entityType: l.entity_type ?? 'audit',
          entityName: l.target ?? null,
          entityId: l.entity_id ?? null,
          createdAt: l.created_at,
          actor: null,
        };
      },
    );

    return NextResponse.json({ items });
  } catch (err) {
    log.error({ err }, 'recent-activity unexpected error');
    return NextResponse.json({ items: [] });
  }
}
