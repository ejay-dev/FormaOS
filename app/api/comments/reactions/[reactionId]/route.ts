import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { removeReaction } from '@/lib/comments';

const log = routeLog('/api/comments/reactions/[reactionId]');

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reactionId: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { reactionId } = await params;
    await removeReaction(reactionId, user.id, orgId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'failed to remove reaction');
    const status =
      err instanceof Error && err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: 'Failed' }, { status });
  }
}
