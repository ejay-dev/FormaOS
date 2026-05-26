import { z } from 'zod';
import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { getStringParam } from '@/lib/api/v1-helpers';
import { createForm, listForms } from '@/lib/forms/form-store';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const createFormSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with dashes')
    .optional(),
  fields: z.array(z.record(z.string(), z.unknown())).max(200).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

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

    return jsonWithContext(
      auth.context,
      paginatedEnvelope(result.data, { offset, limit, total: result.total }),
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to list forms' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const validation = await validateBody(request, createFormSchema);
  if (!validation.success) {
    return Response.json(formatZodError(validation.error), { status: 400 });
  }
  const { title, description, slug, fields, settings } = validation.data;

  try {
    const form = await createForm(
      auth.context.db,
      auth.context.orgId,
      auth.context.userId ?? '',
      {
        title,
        description,
        slug:
          slug ??
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 64),
        fields,
        settings,
      },
    );

    return Response.json({ data: form }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to create form' },
      { status: 500 },
    );
  }
}
