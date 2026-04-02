import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateV1Request,
} from '@/lib/api-keys/middleware';
import { getSearchAnalytics } from '@/lib/search/search-engine';

export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['audit:read'],
  });
  if (!auth.ok) return auth.response;

  const analytics = await getSearchAnalytics(auth.context.orgId);

  return NextResponse.json(analytics);
}
