import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import {
  getForm,
  updateForm,
  archiveForm,
  publishForm,
  duplicateForm,
} from '@/lib/forms/form-store';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:read'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;

  try {
    const form = await getForm(auth.context.db, formId, auth.context.orgId);
    logV1Access(auth.context, 'forms.get', { formId });
    return jsonWithContext({ data: form }, auth.context);
  } catch {
    return Response.json(
      { error: { message: 'Form not found' } },
      { status: 404 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;
  const body = await request.json();

  try {
    const { title, description, slug, fields, settings } = body as Record<
      string,
      unknown
    >;
    const form = await updateForm(auth.context.db, formId, auth.context.orgId, {
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
      slug: typeof slug === 'string' ? slug : undefined,
      fields: Array.isArray(fields) ? fields : undefined,
      settings:
        settings && typeof settings === 'object'
          ? (settings as Record<string, unknown>)
          : undefined,
    });

    logV1Access(auth.context, 'forms.update', { formId });
    return jsonWithContext({ data: form }, auth.context);
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Failed to update form',
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;

  try {
    const form = await archiveForm(auth.context.db, formId, auth.context.orgId);
    logV1Access(auth.context, 'forms.archive', { formId });
    return jsonWithContext({ data: form }, auth.context);
  } catch {
    return Response.json(
      { error: { message: 'Form not found' } },
      { status: 404 },
    );
  }
}
