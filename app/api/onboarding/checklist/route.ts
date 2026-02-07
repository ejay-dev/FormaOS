import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getChecklistCountsForOrg } from '@/lib/onboarding/checklist-data';

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
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const orgId = membership?.organization_id;
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 },
    );
  }

  const counts = await getChecklistCountsForOrg(orgId);

  return NextResponse.json(counts);
}
