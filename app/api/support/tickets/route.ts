import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,

} from '@/lib/security/rate-limiter';

const log = routeLog('/api/support/tickets');

export async function POST(request: Request) {
  try {
    // Rate limit ticket creation (5 req / 10 min per IP)
    const identifier = await getClientIdentifier();
    const rl = await checkRateLimit(RATE_LIMITS.EXPORT, identifier);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: createRateLimitHeaders(rl) },
      );
    }

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

    const orgId = membership?.organization_id ?? null;

    const payload = await request.json().catch(() => ({}));
    const message = String(payload?.message ?? '').trim();
    const route = String(payload?.route ?? '/app');
    const meta = payload?.meta ?? {};

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      org_id: orgId,
      route,
      message: message.slice(0, 5000),
      meta_json: meta,
      status: 'open',
    });

    if (error) {
      log.error({ err: error }, "[support/tickets] Insert failed:");
      return NextResponse.json(
        { error: 'Failed to submit ticket' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err: err }, "[support/tickets] Error:");
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
