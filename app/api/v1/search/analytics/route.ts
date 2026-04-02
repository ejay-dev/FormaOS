import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getSearchAnalytics } from '@/lib/search/search-engine';

export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['admin:read'],
  });
  if ('error' in auth) return auth.error;

  const analytics = await getSearchAnalytics(auth.orgId);

  logV1Access(auth, 'search.analytics', {});
  return jsonWithContext(analytics);
}
