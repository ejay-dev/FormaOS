import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    org_id: orgId,
    route,
    message,
    meta_json: meta,
    status: 'open',
  });

  if (error) {
    console.error('[support/tickets] Insert failed:', error);
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
