import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import {
  getTrend,
  getSnapshots,
  getMetricSummary,
} from '@/lib/analytics/snapshot-engine';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['reports:read'],
  });
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const metric = url.searchParams.get('metric');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return Response.json(
      { error: { message: 'from and to query parameters are required' } },
      { status: 400 },
    );
  }

  try {
    if (metric) {
      const trend = await getTrend(
        auth.context.db,
        auth.context.orgId,
        metric,
        { from, to },
      );
      const summary = await getMetricSummary(
        auth.context.db,
        auth.context.orgId,
        metric,
        { from, to },
      );
      logV1Access(auth.context, 200, 'reports:read');
      return jsonWithContext({ data: { trend, summary } }, auth.context);
    }

    const snapshots = await getSnapshots(auth.context.db, auth.context.orgId, {
      from,
      to,
    });
    logV1Access(auth.context, 200, 'reports:read');
    return jsonWithContext({ data: snapshots }, auth.context);
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : 'Failed to get trends',
        },
      },
      { status: 500 },
    );
  }
}
