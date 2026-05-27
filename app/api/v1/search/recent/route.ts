import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { getRecentItems } from '@/lib/search/recent-items';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/search/recent');

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:read'],
    });
    if (!auth.ok) return auth.response;

    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10);
    const items = await getRecentItems(
      auth.context.orgId,
      auth.context.userId ?? '',
      limit,
    );

    return NextResponse.json({ recentItems: items });
  } catch (error) {
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
