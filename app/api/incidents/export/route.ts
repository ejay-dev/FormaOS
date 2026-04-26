import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  checkRateLimit,
  getClientIdentifier,
  getUserIdentifier,
  createRateLimitHeaders,
  isLocalE2ERateLimitBypass,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import {
  attachmentHeaders,
  formatTabular,
  parseFormat,
} from '@/lib/exports/formatters';

const log = routeLog('/api/incidents/export');

export async function GET(request: NextRequest) {
  if (!isLocalE2ERateLimitBypass(request)) {
    const rlUserId = await getUserIdentifier();
    const rlIdentifier = rlUserId ?? (await getClientIdentifier());
    const rl = await checkRateLimit(RATE_LIMITS.EXPORT, rlIdentifier, rlUserId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: createRateLimitHeaders(rl) },
      );
    }
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
        patient_id,
        reported_by,
        incident_type,
        severity,
        status,
        description,
        location,
        occurred_at,
        resolved_at,
        follow_up_required,
        follow_up_due_date
      `,
      )
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(5000);

    if (error) {
      log.error({ err: error.message }, '[incidents/export] query failed:');
      return NextResponse.json({ error: 'export_query_failed' }, { status: 500 });
    }

    const patientIds = [
      ...new Set(
        (incidents ?? [])
          .map((item) => item.patient_id as string | null)
          .filter(Boolean),
      ),
    ] as string[];
    const reporterIds = [
      ...new Set(
        (incidents ?? [])
          .map((item) => item.reported_by as string | null)
          .filter(Boolean),
      ),
    ] as string[];

    const [{ data: patients }, { data: reporters }] = await Promise.all([
      patientIds.length
        ? supabase
            .from('org_patients')
            .select('id, full_name')
            .eq('organization_id', orgId)
            .in('id', patientIds)
        : Promise.resolve({ data: [] }),
      reporterIds.length
        ? supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', reporterIds)
        : Promise.resolve({ data: [] }),
    ]);
    const patientNameById = new Map(
      (patients ?? []).map((patient) => [
        patient.id as string,
        patient.full_name as string,
      ]),
    );
    const reporterNameById = new Map(
      (reporters ?? []).map((reporter) => [
        reporter.user_id as string,
        reporter.full_name as string,
      ]),
    );

    const mapped = (incidents ?? []).map((item) => ({
      incident_id: item.id,
      type: item.incident_type,
      severity: item.severity,
      status: item.status,
      client_name: patientNameById.get(item.patient_id as string) ?? '',
      reporter: reporterNameById.get(item.reported_by as string) ?? '',
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
