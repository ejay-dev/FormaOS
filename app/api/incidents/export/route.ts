import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  checkRateLimit,
  getClientIdentifier,
  getUserIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,

} from '@/lib/security/rate-limiter';

const log = routeLog('/api/incidents/export');

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  const rlUserId = await getUserIdentifier();
  const rlIdentifier = rlUserId ?? (await getClientIdentifier());
  const rl = await checkRateLimit(RATE_LIMITS.EXPORT, rlIdentifier, rlUserId);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: createRateLimitHeaders(rl) },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = membership?.organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 403 },
      );
    }

    const { data: incidents, error } = await supabase
      .from('org_incidents')
      .select(
        `
        id,
        incident_type,
        severity,
        status,
        description,
        location,
        occurred_at,
        resolved_at,
        follow_up_required,
        follow_up_due_date,
        patient:patient_id(full_name),
        reporter:reported_by(email)
      `,
      )
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(5000);

    if (error) {
      log.error({ err: error.message }, "[incidents/export] query failed:");
      return NextResponse.json({ error: 'export_query_failed' }, { status: 500 });
    }

    const headers = [
      'incident_id',
      'type',
      'severity',
      'status',
      'client_name',
      'reporter_email',
      'occurred_at',
      'resolved_at',
      'follow_up_required',
      'follow_up_due_date',
      'location',
      'description',
    ];

    const lines = [headers.join(',')];
    for (const item of incidents ?? []) {
      const row = [
        item.id,
        item.incident_type,
        item.severity,
        item.status,
        (item.patient as any)?.full_name ?? '',
        (item.reporter as any)?.email ?? '',
        item.occurred_at,
        item.resolved_at,
        item.follow_up_required ? 'true' : 'false',
        item.follow_up_due_date,
        item.location,
        item.description,
      ].map(escapeCsv);
      lines.push(row.join(','));
    }

    const today = new Date().toISOString().slice(0, 10);
    const filename = `incidents_export_${today}.csv`;
    const csv = lines.join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    log.error({ err: error }, "[api/incidents/export] Error:");
    return NextResponse.json(
      { error: 'Failed to export incidents' },
      { status: 500 },
    );
  }
}
