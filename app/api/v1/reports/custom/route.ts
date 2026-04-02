import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['reports:read'],
  });
  if (!auth.ok) return auth.response;

  const { limit, offset } = getPagination(request, 25, 100);

  try {
    const { data, count } = await auth.context.db
      .from('org_saved_reports')
      .select('*', { count: 'exact' })
      .eq('org_id', auth.context.orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    logV1Access(auth.context, 200, 'reports:read');
    return jsonWithContext(
      auth.context,
      paginatedEnvelope(data ?? [], { offset, limit, total: count ?? 0 }),
    );
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to list reports',
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['reports:write'],
  });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, description, config } = body as Record<string, unknown>;

    if (!name || typeof name !== 'string') {
      return Response.json(
        { error: { message: 'name is required' } },
        { status: 400 },
      );
    }

    const { data, error } = await auth.context.db
      .from('org_saved_reports')
      .insert({
        org_id: auth.context.orgId,
        name,
        description: description ?? null,
        config: config ?? {},
        created_by: auth.context.userId ?? '',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    logV1Access(auth.context, 201, 'reports:write');
    return jsonWithContext(auth.context, { data }, { status: 201 });
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to create report',
        },
      },
      { status: 500 },
    );
  }
}
