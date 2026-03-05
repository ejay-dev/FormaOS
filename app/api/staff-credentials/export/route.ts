import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
  getUserIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      'credential_id',
      'staff_email',
      'type',
      'name',
      'credential_number',
      'issuing_authority',
      'issue_date',
      'expiry_date',
      'status',
      'verified_at',
    ];

    const lines = [headers.join(',')];
    for (const row of rows ?? []) {
      const values = [
        row.id,
        (row.user as any)?.email ?? '',
        row.credential_type,
        row.credential_name,
        row.credential_number,
        row.issuing_authority,
        row.issue_date,
        row.expiry_date,
        row.status,
        row.verified_at,
      ].map(escapeCsv);
      lines.push(values.join(','));
    }

    const today = new Date().toISOString().slice(0, 10);
    const filename = `staff_credentials_export_${today}.csv`;
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
    console.error('[api/staff-credentials/export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export staff credentials' },
      { status: 500 },
    );
  }
}
