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
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reactionId } = await params;
    await removeReaction(reactionId, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'failed to remove reaction');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
