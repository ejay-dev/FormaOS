import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';

type SearchItemType = 'policy' | 'task' | 'evidence';

type SearchItem = {
  id: string;
  title: string;
  type: SearchItemType;
};

export async function GET(request: Request) {
  try {
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const qRaw = (searchParams.get('q') ?? '').trim();
    const q = qRaw.length > 80 ? qRaw.slice(0, 80) : qRaw;

    if (q.length < 2) {
      return NextResponse.json({ query: q, results: [] satisfies SearchItem[] });
    }

    const supabase = await createSupabaseServerClient();
    const membership = await requirePermission('VIEW_CONTROLS');

    const limitEach = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '5', 10), 1),
      10,
    );

    const [policies, tasks, evidence] = await Promise.all([
      supabase
        .from('org_policies')
        .select('id, title')
        .eq('organization_id', membership.orgId)
        .ilike('title', `%${q}%`)
        .limit(limitEach),
      supabase
        .from('org_tasks')
        .select('id, title')
        .eq('organization_id', membership.orgId)
        .ilike('title', `%${q}%`)
        .limit(limitEach),
      supabase
        .from('org_evidence')
        .select('id, title, file_name')
        .eq('organization_id', membership.orgId)
        .or(`title.ilike.%${q}%,file_name.ilike.%${q}%`)
        .limit(limitEach),
    ]);

    if (policies.error || tasks.error || evidence.error) {
      console.error('[api/search] query error', {
        policies: policies.error?.message ?? null,
        tasks: tasks.error?.message ?? null,
        evidence: evidence.error?.message ?? null,
      });
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const results: SearchItem[] = [
      ...(policies.data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? 'Untitled policy',
        type: 'policy' as const,
      })),
      ...(tasks.data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? 'Untitled task',
        type: 'task' as const,
      })),
      ...(evidence.data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? row.file_name ?? 'Untitled evidence',
        type: 'evidence' as const,
      })),
    ];

    return NextResponse.json({ query: q, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message.toLowerCase().includes('access denied')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[api/search] unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

