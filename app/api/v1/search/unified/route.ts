import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { search, trackSearch } from '@/lib/search/search-engine';
import { getStringParam } from '@/lib/api/v1-helpers';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/search/unified');

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:read'],
    });
    if (!auth.ok) return auth.response;

    const q = getStringParam(req.nextUrl.searchParams, 'q') ?? '';
    if (!q)
      return NextResponse.json(
        { error: 'q parameter required' },
        { status: 400 },
      );

    const entityTypes =
      req.nextUrl.searchParams.get('types')?.split(',').filter(Boolean) ??
      undefined;
    const from = getStringParam(req.nextUrl.searchParams, 'from') ?? undefined;
    const to = getStringParam(req.nextUrl.searchParams, 'to') ?? undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10);

    const { results, total } = await search(auth.context.orgId, q, {
      entityTypes,
      from,
      to,
      limit,
      offset,
    });

    await trackSearch(auth.context.orgId, auth.context.userId ?? '', q, total);

    return NextResponse.json({ results, total, limit, offset });
  } catch (error) {
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
