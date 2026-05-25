import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/staff-compliance/practitioners');
const DAY_MS = 86_400_000;

const AHPRA_TYPES = new Set(['ahpra', 'medical', 'nursing', 'practitioner']);

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
      return NextResponse.json({ practitioners: [] });
    }
    const { orgId } = ctx;

    const { data: creds, error } = await supabase
      .from('org_staff_credentials')
      .select('id, user_id, credential_name, credential_type, credential_number, expiry_date, status')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load credentials');
      return NextResponse.json({ practitioners: [] });
    }

    const now = Date.now();
    const grouped = new Map<string, {
      id: string;
      name: string;
      ahpraStatus: 'registered' | 'suspended' | 'lapsed';
      cpdLogged: number;
      cpdRequired: number;
      indemnityExpiry: string;
      indemnityDaysRemaining: number;
    }>();

    for (const c of creds ?? []) {
      const userId = (c.user_id as string) || (c.id as string);
      const existing = grouped.get(userId) ?? {
        id: userId,
        name: (c.credential_name as string) || (c.credential_number as string) || 'Practitioner',
        ahpraStatus: 'registered' as const,
        cpdLogged: 0,
        cpdRequired: 50,
        indemnityExpiry: '',
        indemnityDaysRemaining: 365,
      };

      const type = (c.credential_type as string | null)?.toLowerCase() || '';
      if (AHPRA_TYPES.has(type) || type.includes('ahpra')) {
        existing.ahpraStatus = c.status === 'suspended' ? 'suspended'
          : c.status === 'expired' ? 'lapsed' : 'registered';
      }
      if (type.includes('indemnity') || type.includes('insurance')) {
        if (c.expiry_date) {
          existing.indemnityExpiry = c.expiry_date as string;
          existing.indemnityDaysRemaining = Math.ceil(
            (new Date(c.expiry_date as string).getTime() - now) / DAY_MS,
          );
        }
      }
      grouped.set(userId, existing);
    }

    return NextResponse.json({ practitioners: Array.from(grouped.values()).slice(0, 25) });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ practitioners: [] });
  }
}
