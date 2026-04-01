import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generatePIIReport } from '@/lib/data-governance/pii-scanner';
import { validateCsrfOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('pii_scan_results')
      .select('*')
      .eq('org_id', context.orgId)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, scans: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Forbidden' },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const context = await requireOrgAdminContext((body.orgId as string | undefined) ?? null);
    const report = await generatePIIReport(context.orgId);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'PII scan failed' },
      { status: 400 },
    );
  }
}
