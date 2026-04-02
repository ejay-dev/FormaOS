import {
  authenticateV1Request,
  jsonWithContext,
} from '@/lib/api-keys/middleware';
import { getSubmissionAnalytics } from '@/lib/forms/submission-engine';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['compliance:read'],
  });
  if (!auth.ok) return auth.response;

  const { formId } = await params;

  try {
    const analytics = await getSubmissionAnalytics(
      auth.context.db,
      formId,
      auth.context.orgId,
    );
    return jsonWithContext(auth.context, { data: analytics });
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to get analytics',
        },
      },
      { status: 500 },
    );
  }
}
