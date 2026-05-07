import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { addReaction } from '@/lib/comments';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/comments/reactions');

export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

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

    const body = (await request.json().catch(() => ({}))) as {
      commentId?: string;
      emoji?: string;
    };
    if (!body.commentId || !body.emoji) {
      return NextResponse.json(
        { error: 'commentId + emoji required' },
        { status: 400 },
      );
    }

    const reaction = await addReaction(
      body.commentId,
      user.id,
      body.emoji,
      orgId,
    );
    return NextResponse.json({ reaction });
  } catch (err) {
    log.error({ err }, 'failed to add reaction');
    const status =
      err instanceof Error && err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: 'Failed' }, { status });
  }
}
