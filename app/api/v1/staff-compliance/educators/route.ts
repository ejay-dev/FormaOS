import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/staff-compliance/educators');
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

    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) {
      if (ctx.response.status === 401 || ctx.response.status === 409) {
        return ctx.response;
      }
      return NextResponse.json({ educators: [] });
    }
    const { orgId } = ctx;

    const { data: creds, error } = await supabase
      .from('org_staff_credentials')
      .select('id, user_id, credential_name, credential_type, expiry_date')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load credentials');
      return NextResponse.json({ educators: [] });
    }

    const now = Date.now();
    const byUser = new Map<string, {
      id: string;
      name: string;
      wwcExpiry: string;
      wwcDays: number;
      firstAidExpiry: string;
      firstAidDays: number;
      qualificationStatus: 'qualified' | 'in_progress' | 'not_started';
    }>();

    for (const c of creds ?? []) {
      const userId = (c.user_id as string) || (c.id as string);
      const record = byUser.get(userId) ?? {
        id: userId,
        name: (c.credential_name as string) || 'Educator',
        wwcExpiry: '',
        wwcDays: 0,
        firstAidExpiry: '',
        firstAidDays: 0,
        qualificationStatus: 'not_started' as const,
      };

      const type = (c.credential_type as string | null)?.toLowerCase() || '';
      const name = (c.credential_name as string | null)?.toLowerCase() || '';
      const expiry = c.expiry_date as string | null;
      const days = expiry
        ? Math.ceil((new Date(expiry).getTime() - now) / DAY_MS)
        : 0;

      if (type.includes('wwc') || name.includes('working with children') || name.includes('wwcc')) {
        record.wwcExpiry = expiry || '';
        record.wwcDays = days;
      } else if (type.includes('first_aid') || name.includes('first aid') || name.includes('cpr')) {
        record.firstAidExpiry = expiry || '';
        record.firstAidDays = days;
      } else if (type.includes('qualification') || name.includes('diploma') || name.includes('certificate')) {
        record.qualificationStatus = 'qualified';
      }
      byUser.set(userId, record);
    }

    return NextResponse.json({ educators: Array.from(byUser.values()).slice(0, 25) });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ educators: [] });
  }
}
