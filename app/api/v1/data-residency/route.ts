import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getAvailableRegions,
  getOrgDataRegion,
  setOrgDataRegion,
  type DataRegion,
} from '@/lib/data-residency';

export const runtime = 'nodejs';

// GET — return org's current region + all available regions
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 });
  }

  const currentRegion = await getOrgDataRegion(membership.organization_id);
  const availableRegions = getAvailableRegions();

  return NextResponse.json({
    currentRegion,
    availableRegions,
  });
}

// PATCH — update org's data residency region (admin only)
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || membership.role !== 'admin') {
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

  if (!region || typeof region !== 'string' || !VALID_REGIONS.includes(region as DataRegion)) {
    return NextResponse.json(
      { error: `region is required and must be one of: ${VALID_REGIONS.join(', ')}` },
      { status: 400 },
    );
  }

  const validRegion = region as DataRegion;
  const result = await setOrgDataRegion(membership.organization_id, validRegion);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, region: validRegion });
}
