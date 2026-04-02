import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getSubmissionAnalytics } from '@/lib/forms/submission-engine';

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
    const analytics = await getSubmissionAnalytics(
      auth.context.db,
      formId,
      auth.context.orgId,
    );
    logV1Access(auth.context, 'forms.analytics', { formId });
    return jsonWithContext({ data: analytics }, auth.context);
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
