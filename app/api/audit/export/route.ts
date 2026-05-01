import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { buildOrSearch } from '@/lib/utils/postgrest-search';

const log = routeLog('/api/audit/export');

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('audit_log')
      .select('id, action, resource_type, resource_id, details, created_at, user_id, ip_address')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10_000);

    if (actions.length > 0) query = query.in('action', actions);
    if (entityTypes.length > 0) query = query.in('resource_type', entityTypes);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);
    if (search) {
      const predicate = buildOrSearch(['action', 'resource_type'], search);
      if (predicate) {
        query = query.or(predicate);
      }
    }

    const { data, error } = await query;
    if (error) {
      log.error({ err: error }, 'failed to load audit logs for export');
      return new NextResponse('Failed to export', { status: 500 });
    }

    const header = [
      'id',
      'created_at',
      'action',
      'entity_type',
      'entity_id',
      'user_id',
      'ip_address',
      'details',
    ];

    const rows = (data ?? []).map((row) =>
      [
        row.id,
        row.created_at,
        row.action,
        row.resource_type,
        row.resource_id,
        row.user_id,
        row.ip_address,
        row.details,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csv = [header.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return new NextResponse('Failed to export', { status: 500 });
  }
}
