import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['notifications:read'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { limit, offset, searchParams } = getPagination(request, 25, 100);
  const unreadOnly = searchParams.get('unread') === 'true';

  let query = auth.context.db
    .from('org_notifications')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.context.orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (auth.context.userId) {
    query = query.eq('user_id', auth.context.userId);
  }

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, count } = await query;
  await logV1Access(auth.context, 200, 'notifications:read');
  return jsonWithContext(
    auth.context,
    paginatedEnvelope(data ?? [], { offset, limit, total: count ?? data?.length ?? 0 }),
  );
}

export async function PATCH(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['notifications:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | { ids?: unknown; all?: unknown }
    | null;
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((value): value is string => typeof value === 'string')
    : [];
  const markAll = body?.all === true;

  let query = auth.context.db
    .from('org_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('organization_id', auth.context.orgId);

  if (auth.context.userId) {
    query = query.eq('user_id', auth.context.userId);
  }

  if (!markAll && ids.length > 0) {
    query = query.in('id', ids);
  }

  const { data } = await query.select('id');

  await logV1Access(auth.context, 200, 'notifications:write');
  return jsonWithContext(auth.context, createEnvelope({ updated: data?.length ?? 0 }));
}
