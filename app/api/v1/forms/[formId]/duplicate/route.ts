import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { duplicateForm } from '@/lib/forms/form-store';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['compliance:read'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;

  try {
    const form = await duplicateForm(
      auth.context.db,
      formId,
      auth.context.orgId,
      auth.context.userId ?? '',
    );
    return jsonWithContext(auth.context, { data: form }, { status: 201 });
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
