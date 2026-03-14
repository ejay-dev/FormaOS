import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import {
  generateClassificationReport,
  upsertClassifications,
} from '@/lib/data-governance/classification';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const report = await generateClassificationReport(context.orgId);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Forbidden' },
      { status: 403 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const context = await requireOrgAdminContext((body.orgId as string | undefined) ?? null);
    await upsertClassifications(
      context.orgId,
      Array.isArray(body.entries)
        ? body.entries.map((entry) => ({
            resource_type: String((entry as any).resource_type ?? (entry as any).resourceType ?? ''),
            field_name: String((entry as any).field_name ?? (entry as any).fieldName ?? ''),
            level: (entry as any).level,
            source: (entry as any).source ?? 'manual',
            notes: (entry as any).notes ?? null,
          }))
        : [],
    );
    const report = await generateClassificationReport(context.orgId);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to update classifications' },
      { status: 400 },
    );
  }
}
