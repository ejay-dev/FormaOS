import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { suggest } from '@/lib/search/search-engine';
import { getStringParam } from '@/lib/api/v1-helpers';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/search/suggest');

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:read'],
    });
    if (!auth.ok) return auth.response;

    const prefix = getStringParam(req.nextUrl.searchParams, 'q') ?? '';
    if (!prefix)
      return NextResponse.json(
        { error: 'q parameter required' },
        { status: 400 },
      );

    const suggestions = await suggest(
      auth.context.orgId,
      prefix,
      auth.context.userId ?? undefined,
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
