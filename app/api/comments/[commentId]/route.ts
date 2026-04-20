import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { updateComment, deleteComment } from '@/lib/comments';

const log = routeLog('/api/comments/[commentId]');

async function requireUserAndOrg() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const orgId = membership?.organization_id as string | undefined;
  if (!orgId) return null;

  return { user, orgId };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const ctx = await requireUserAndOrg();
    if (!ctx)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { commentId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      content?: string;
    };
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const comment = await updateComment(
      commentId,
      ctx.user.id,
      body.content,
      ctx.orgId,
    );
    return NextResponse.json({ comment });
  } catch (err) {
    log.error({ err }, 'failed to update comment');
    const status =
      err instanceof Error && err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const ctx = await requireUserAndOrg();
    if (!ctx)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { commentId } = await params;
    await deleteComment(commentId, ctx.user.id, ctx.orgId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'failed to delete comment');
    const status =
      err instanceof Error && err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status },
    );
  }
}
