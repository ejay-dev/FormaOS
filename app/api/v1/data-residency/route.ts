import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getAvailableRegions,
  getOrgDataRegion,
  setOrgDataRegion,
  type DataRegion,
} from '@/lib/data-residency';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

export const runtime = 'nodejs';

// GET — return org's current region + all available regions
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const ctx = await requireActiveOrgContext(supabase);
  if (!ctx.ok) return ctx.response;

  const currentRegion = await getOrgDataRegion(ctx.orgId);
  const availableRegions = getAvailableRegions();

  return NextResponse.json({
    currentRegion,
    availableRegions,
  });
}

// PATCH — update org's data residency region (admin only)
export async function PATCH(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const supabase = await createSupabaseServerClient();
  const ctx = await requireActiveOrgContext(supabase);
  if (!ctx.ok) return ctx.response;

  if (!ctx.role || !['owner', 'admin'].includes(ctx.role)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const VALID_REGIONS: DataRegion[] = ['au', 'us', 'eu'];
  const region = (body as Record<string, unknown>)?.region;

  if (
    !region ||
    typeof region !== 'string' ||
    !VALID_REGIONS.includes(region as DataRegion)
  ) {
    return NextResponse.json(
      {
        error: `region is required and must be one of: ${VALID_REGIONS.join(', ')}`,
      },
      { status: 400 },
    );
  }

  const validRegion = region as DataRegion;
  const result = await setOrgDataRegion(ctx.orgId, validRegion);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, region: validRegion });
}
