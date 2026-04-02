import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getOrgUsage, getUsageSummary } from '@/lib/ai/usage-meter';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['compliance:read'],
  });
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const plan = url.searchParams.get('plan') ?? 'starter';

  try {
    if (from && to) {
      const usage = await getOrgUsage(auth.context.db, auth.context.orgId, {
        from,
        to,
      });
      logV1Access(auth.context, 200, 'compliance:read');
      return jsonWithContext(auth.context, { data: usage });
    }

    const summary = await getUsageSummary(
      auth.context.db,
      auth.context.orgId,
      plan,
    );
    logV1Access(auth.context, 200, 'compliance:read');
    return jsonWithContext(auth.context, { data: summary });
  } catch (err) {
    return Response.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : 'Failed to get AI usage',
        },
      },
      { status: 500 },
    );
  }
}
