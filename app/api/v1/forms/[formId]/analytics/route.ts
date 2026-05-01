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
    const { data: entitlement, error: entitlementError } = await auth.context.db
      .from('org_entitlements')
      .select('enabled')
      .eq('organization_id', auth.context.orgId)
      .eq('feature_key', 'form_analytics')
      .maybeSingle();

    if (entitlementError || entitlement?.enabled !== true) {
      return jsonWithContext(
        auth.context,
        {
          error: {
            message: 'Form analytics requires a Growth or Enterprise entitlement',
          },
        },
        { status: 403 },
      );
    }

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
