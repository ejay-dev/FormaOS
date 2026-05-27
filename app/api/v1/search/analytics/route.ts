import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { getSearchAnalytics } from '@/lib/search/search-engine';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/search/analytics');

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['audit:read'],
    });
    if (!auth.ok) return auth.response;

    const analytics = await getSearchAnalytics(auth.context.orgId);

    return NextResponse.json(analytics);
  } catch (error) {
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
