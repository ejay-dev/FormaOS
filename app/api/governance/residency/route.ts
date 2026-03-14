import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import {
  getAvailableRegions,
  getOrgDataRegion,
  setOrgDataRegion,
  type DataRegion,
} from '@/lib/data-residency';
import { listResidencyViolations } from '@/lib/data-governance/residency-enforcement';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const [region, violations] = await Promise.all([
      getOrgDataRegion(context.orgId),
      listResidencyViolations(context.orgId),
    ]);
    return NextResponse.json({
      ok: true,
      region,
      availableRegions: getAvailableRegions(),
      violations,
    });
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
    const region = body.region as DataRegion;
    const result = await setOrgDataRegion(context.orgId, region);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Residency update failed' },
      { status: 400 },
    );
  }
}
