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
    .single();

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
    .single();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const region = body.region as DataRegion;

  if (!region) {
    return NextResponse.json({ error: 'region is required' }, { status: 400 });
  }

  const result = await setOrgDataRegion(membership.organization_id, region);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, region });
}
