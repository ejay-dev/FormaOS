import { z } from 'zod';
import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).max(500).optional().default([]),
  all: z.boolean().optional().default(false),
});

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
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['notifications:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const validation = await validateBody(request, markReadSchema);
  if (!validation.success) {
    await logV1Access(auth.context, 400, 'notifications:write');
    return jsonWithContext(
      auth.context,
      formatZodError(validation.error),
      { status: 400 },
    );
  }
  const { ids, all: markAll } = validation.data;

  // v4-019: API-key context (no userId) previously skipped the
  // user_id filter, so a `markAll` + empty `ids` would update every
  // notification in the org for every user. Refuse the bulk-mark
  // paths entirely when there's no user scope — API keys must
  // supply an explicit `ids` list.
  if (!auth.context.userId) {
    if (markAll || ids.length === 0) {
      await logV1Access(auth.context, 400, 'notifications:write');
      return jsonWithContext(
        auth.context,
        createEnvelope({
          error: 'ids_required_for_api_key_context',
          message:
            'API key requests must specify an explicit ids[] array; markAll requires a user-scoped session.',
        }),
        { status: 400 },
      );
    }
  }

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
