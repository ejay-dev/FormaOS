import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import type { DataClassificationLevel } from '@/lib/data-governance/classification';
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
        ? body.entries.map((entry) => {
            const e = entry as Record<string, unknown>;
            return {
              resource_type: String(e.resource_type ?? e.resourceType ?? ''),
              field_name: String(e.field_name ?? e.fieldName ?? ''),
              level: e.level as DataClassificationLevel,
              source: (e.source as 'manual' | 'automatic') ?? 'manual',
              notes: (e.notes as string | null) ?? null,
            };
          })
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
