import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/staff-compliance/screening');
const DAY_MS = 86_400_000;

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ workers: [] });

    const { data: credentials, error } = await supabase
      .from('org_staff_credentials')
      .select('id, credential_name, credential_type, credential_number, expiry_date, status, user_id')
      .eq('organization_id', orgId)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true })
      .limit(25);

    if (error) {
      log.error({ err: error }, 'failed to load credentials');
      return NextResponse.json({ workers: [] });
    }

    const now = Date.now();
    const workers = (credentials ?? []).map((c) => {
      const expiry = new Date(c.expiry_date as string).getTime();
      const daysRemaining = Math.ceil((expiry - now) / DAY_MS);
      const checkStatus: 'current' | 'expiring_soon' | 'expired' =
        daysRemaining < 0 ? 'expired' : daysRemaining <= 30 ? 'expiring_soon' : 'current';
      return {
        id: c.id as string,
        name: (c.credential_name as string) || (c.credential_number as string) || 'Credential',
        checkStatus,
        expiryDate: c.expiry_date as string,
        daysRemaining,
      };
    });

    return NextResponse.json({ workers });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ workers: [] });
  }
}
