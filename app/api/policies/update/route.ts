import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/policies/update');

export async function POST(request: Request) {
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
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = (await request.json().catch(() => ({}))) as {
      policyId?: string;
      html?: string;
      title?: string;
    };
    if (!body.policyId) {
      return NextResponse.json({ error: 'policyId required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };
    if (typeof body.html === 'string') updates.content = body.html;
    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }

    const { error } = await supabase
      .from('org_policies')
      .update(updates)
      .eq('id', body.policyId)
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to update policy');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedAt: updates.updated_at });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
