import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { setCurrentOrganization } from '@/lib/multi-org';

const log = routeLog('/api/organizations/switch');

export async function POST(request: Request) {
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

    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
    };
    if (!body.organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    await setCurrentOrganization(user.id, body.organizationId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'failed to switch organization');
    const message = err instanceof Error ? err.message : 'Failed to switch';
    const status = message.includes('access') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
