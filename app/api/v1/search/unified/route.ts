import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { search, trackSearch } from '@/lib/search/search-engine';
import { getStringParam } from '@/lib/api/v1-helpers';

export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:read'],
  });
  if ('error' in auth) return auth.error;

  const q = getStringParam(req, 'q') ?? '';
  if (!q) return jsonWithContext({ error: 'q parameter required' }, 400);

  const entityTypes =
    req.nextUrl.searchParams.get('types')?.split(',').filter(Boolean) ??
    undefined;
  const from = getStringParam(req, 'from') ?? undefined;
  const to = getStringParam(req, 'to') ?? undefined;
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10);

  const { results, total } = await search(auth.orgId, q, {
    entityTypes,
    from,
    to,
    limit,
    offset,
  });

  await trackSearch(auth.orgId, auth.userId, q, total);

  logV1Access(auth, 'search.unified', { query: q, total });
  return jsonWithContext({ results, total, limit, offset });
}
