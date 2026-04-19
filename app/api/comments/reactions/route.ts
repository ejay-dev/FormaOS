import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { addReaction } from '@/lib/comments';

const log = routeLog('/api/comments/reactions');

export async function POST(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      commentId?: string;
      emoji?: string;
    };
    if (!body.commentId || !body.emoji) {
      return NextResponse.json({ error: 'commentId + emoji required' }, { status: 400 });
    }

    const reaction = await addReaction(body.commentId, user.id, body.emoji);
    return NextResponse.json({ reaction });
  } catch (err) {
    log.error({ err }, 'failed to add reaction');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
