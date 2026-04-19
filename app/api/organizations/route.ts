import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { getUserOrganizations } from '@/lib/multi-org';

const log = routeLog('/api/organizations');

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await getUserOrganizations(user.id);
    const organizations = memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      membershipStatus: m.status,
    }));

    const { data: preference } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentOrgId =
      preference?.current_organization_id || organizations[0]?.id || null;

    return NextResponse.json({ organizations, currentOrgId });
  } catch (err) {
    log.error({ err }, 'failed to load organizations');
    return NextResponse.json({ organizations: [], currentOrgId: null });
  }
}
