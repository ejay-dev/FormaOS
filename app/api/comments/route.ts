import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { createComment, getComments } from '@/lib/comments';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/comments');

const VALID_ENTITIES = new Set([
  'task',
  'certificate',
  'evidence',
  'organization',
]);

async function requireUserAndOrg() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = membership?.organization_id as string | undefined;
  if (!orgId) return { error: 'No organization', status: 400 as const };
  return { user, orgId };
}

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const ctx = await requireUserAndOrg();
    if ('error' in ctx) {
      return NextResponse.json({ comments: [] }, { status: ctx.status });
    }

    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType') || '';
    const entityId = url.searchParams.get('entityId') || '';
    if (!VALID_ENTITIES.has(entityType) || !entityId) {
      return NextResponse.json({ comments: [] });
    }

    const comments = await getComments(
      ctx.orgId,
      entityType as 'task' | 'certificate' | 'evidence' | 'organization',
      entityId,
    );
    return NextResponse.json({ comments });
  } catch (err) {
    log.error({ err }, 'failed to load comments');
    return NextResponse.json({ comments: [] });
  }
}

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

    const ctx = await requireUserAndOrg();
    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const body = (await request.json().catch(() => ({}))) as {
      entityType?: string;
      entityId?: string;
      content?: string;
      parentId?: string;
    };

    if (
      !body.entityType ||
      !VALID_ENTITIES.has(body.entityType) ||
      !body.entityId ||
      !body.content?.trim()
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
      const comment = await createComment(ctx.orgId, ctx.user.id, {
        entityType: body.entityType as
          | 'task'
          | 'certificate'
          | 'evidence'
          | 'organization',
        entityId: body.entityId,
        content: body.content,
        parentId: body.parentId,
      });
      return NextResponse.json({ comment });
    } catch (err) {
      if (err instanceof Error && err.message === 'Entity not found') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw err;
    }
  } catch (err) {
    log.error({ err }, 'failed to create comment');
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 },
    );
  }
}
