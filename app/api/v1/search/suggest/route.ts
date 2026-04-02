import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { suggest } from '@/lib/search/search-engine';
import { getStringParam } from '@/lib/api/v1-helpers';

export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:read'],
  });
  if ('error' in auth) return auth.error;

  const prefix = getStringParam(req, 'q') ?? '';
  if (!prefix) return jsonWithContext({ error: 'q parameter required' }, 400);

  const suggestions = await suggest(auth.orgId, prefix, auth.userId);

  logV1Access(auth, 'search.suggest', { prefix });
  return jsonWithContext({ suggestions });
}
