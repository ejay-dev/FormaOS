import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { getStringParam } from '@/lib/api/v1-helpers';
import { createForm, listForms } from '@/lib/forms/form-store';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:read'],
  });
  if (!auth.ok) return auth.response;

  const { limit, offset, searchParams } = getPagination(request, 25, 100);
  const status = getStringParam(searchParams, 'status');
  const search = getStringParam(searchParams, 'q');

  try {
    const result = await listForms(auth.context.db, auth.context.orgId, {
      status: status as 'draft' | 'published' | 'archived' | undefined,
      search: search ?? undefined,
      cursor: offset,
      limit,
    });

    logV1Access(auth.context, 'forms.list', { status, search });

    return jsonWithContext(
      paginatedEnvelope(result.data, { offset, limit, total: result.total }),
      auth.context,
    );
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Failed to list forms',
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { title, description, slug, fields, settings } = body as Record<
      string,
      unknown
    >;

    if (!title || typeof title !== 'string') {
      return Response.json(
        { error: { message: 'title is required' } },
        { status: 400 },
      );
    }

    const form = await createForm(
      auth.context.db,
      auth.context.orgId,
      auth.context.userId,
      {
        title,
        description: typeof description === 'string' ? description : undefined,
        slug:
          typeof slug === 'string'
            ? slug
            : title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .slice(0, 64),
        fields: Array.isArray(fields) ? fields : undefined,
        settings:
          settings && typeof settings === 'object'
            ? (settings as Record<string, unknown>)
            : undefined,
      },
    );

    logV1Access(auth.context, 'forms.create', { formId: form.id });

    return Response.json({ data: form }, { status: 201 });
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Failed to create form',
        },
      },
      { status: 500 },
    );
  }
}
