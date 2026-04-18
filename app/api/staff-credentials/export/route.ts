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

const log = routeLog('/api/staff-credentials/export');

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

    const { data: rows, error } = await supabase
      .from('org_staff_credentials')
      .select(
        `
        id,
        credential_type,
        credential_name,
        credential_number,
        issuing_authority,
        issue_date,
        expiry_date,
        status,
        verified_at,
        user:user_id(email)
      `,
      )
      .eq('organization_id', orgId)
      .order('expiry_date', { ascending: true })
      .limit(5000);

    if (error) {
      log.error({ err: error.message }, '[staff-credentials/export] query failed:');
      return NextResponse.json({ error: 'export_query_failed' }, { status: 500 });
    }

    const mapped = (rows ?? []).map((row) => ({
      credential_id: row.id,
      staff_email: (row.user as { email?: string } | null)?.email ?? '',
      type: row.credential_type,
      name: row.credential_name,
      credential_number: row.credential_number,
      issuing_authority: row.issuing_authority,
      issue_date: row.issue_date,
      expiry_date: row.expiry_date,
      status: row.status,
      verified_at: row.verified_at,
    }));

    const format = parseFormat(request.nextUrl.searchParams.get('format'));
    const orgName =
      (membership as unknown as { organizations?: { name?: string } })
        ?.organizations?.name ?? 'Organization';
    const today = new Date().toISOString().slice(0, 10);

    const result = formatTabular(mapped, format, {
      title: 'Staff Credentials',
      organizationName: orgName,
      generatedAt: new Date().toISOString(),
      description:
        'Staff credential register sorted by expiry date (most urgent first).',
    });

    return new NextResponse(result.body, {
      status: 200,
      headers: attachmentHeaders(`staff_credentials_export_${today}`, result),
    });
  } catch (error) {
    log.error({ err: error }, '[api/staff-credentials/export] Error:');
    return NextResponse.json(
      { error: 'Failed to export staff credentials' },
      { status: 500 },
    );
  }
}
