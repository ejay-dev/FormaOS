import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  checkRateLimit,
  getClientIdentifier,
  getUserIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import {
  attachmentHeaders,
  formatTabular,
  parseFormat,
} from '@/lib/exports/formatters';

const log = routeLog('/api/incidents/export');

export async function GET(request: NextRequest) {
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
      .select('organization_id, organizations(name)')
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
      log.error({ err: error.message }, '[incidents/export] query failed:');
      return NextResponse.json({ error: 'export_query_failed' }, { status: 500 });
    }

    const mapped = (incidents ?? []).map((item) => ({
      incident_id: item.id,
      type: item.incident_type,
      severity: item.severity,
      status: item.status,
      client_name:
        (item.patient as { full_name?: string } | null)?.full_name ?? '',
      reporter_email:
        (item.reporter as { email?: string } | null)?.email ?? '',
      occurred_at: item.occurred_at,
      resolved_at: item.resolved_at,
      follow_up_required: item.follow_up_required ? 'true' : 'false',
      follow_up_due_date: item.follow_up_due_date,
      location: item.location,
      description: item.description,
    }));

    const format = parseFormat(request.nextUrl.searchParams.get('format'));
    const orgName =
      (membership as unknown as { organizations?: { name?: string } })
        ?.organizations?.name ?? 'Organization';
    const today = new Date().toISOString().slice(0, 10);

    const result = formatTabular(mapped, format, {
      title: 'Incident Report',
      organizationName: orgName,
      generatedAt: new Date().toISOString(),
      description:
        'Incident register sorted by occurrence date (most recent first).',
    });

    return new NextResponse(result.body, {
      status: 200,
      headers: attachmentHeaders(`incidents_export_${today}`, result),
    });
  } catch (error) {
    log.error({ err: error }, '[api/incidents/export] Error:');
    return NextResponse.json(
      { error: 'Failed to export incidents' },
      { status: 500 },
    );
  }
}
