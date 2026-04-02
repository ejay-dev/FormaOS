import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getRecentItems } from '@/lib/search/recent-items';

export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:read'],
  });
  if ('error' in auth) return auth.error;

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10);
  const items = await getRecentItems(auth.orgId, auth.userId, limit);

  logV1Access(auth, 'search.recent', { count: items.length });
  return jsonWithContext({ recentItems: items });
}
