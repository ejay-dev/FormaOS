import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { duplicateForm } from '@/lib/forms/form-store';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:write'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;

  try {
    const form = await duplicateForm(
      auth.context.db,
      formId,
      auth.context.orgId,
      auth.context.userId,
    );
    logV1Access(auth.context, 'forms.duplicate', {
      formId,
      newFormId: form.id,
    });
    return jsonWithContext({ data: form }, auth.context, { status: 201 });
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to duplicate form',
        },
      },
      { status: 500 },
    );
  }
}
