import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { publishForm } from '@/lib/forms/form-store';

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
    const form = await publishForm(auth.context.db, formId, auth.context.orgId);
    return jsonWithContext(auth.context, { data: form });
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to publish form',
        },
      },
      { status: 500 },
    );
  }
}
