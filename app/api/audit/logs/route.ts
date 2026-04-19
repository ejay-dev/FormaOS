import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/audit/logs');

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const requestedOrgId = url.searchParams.get('orgId');
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    const actions = url.searchParams.getAll('actions');
    const entityTypes = url.searchParams.getAll('entityTypes');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const userOrgId = membership?.organization_id as string | undefined;
    const orgId = requestedOrgId || userOrgId;

    if (!orgId) return NextResponse.json({ logs: [], total: 0 });
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('audit_log')
      .select('id, action, resource_type, resource_id, details, created_at, user_id', {
        count: 'exact',
      })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actions.length > 0) query = query.in('action', actions);
    if (entityTypes.length > 0) query = query.in('resource_type', entityTypes);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);
    if (search) {
      const escaped = search.replace(/[%_]/g, '\\$&');
      query = query.or(`action.ilike.%${escaped}%,resource_type.ilike.%${escaped}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      log.error({ err: error }, 'failed to load audit logs');
      return NextResponse.json({ logs: [], total: 0 });
    }

    const logs = (data ?? []).map((row) => ({
      id: row.id as string,
      action: (row.action as string) ?? '',
      entity_type: (row.resource_type as string) ?? '',
      entity_id: (row.resource_id as string | null) ?? null,
      details: (row.details as Record<string, unknown> | null) ?? null,
      created_at: row.created_at as string,
      user: row.user_id ? { id: row.user_id as string } : undefined,
    }));

    return NextResponse.json({ logs, total: count ?? logs.length });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ logs: [], total: 0 });
  }
}
