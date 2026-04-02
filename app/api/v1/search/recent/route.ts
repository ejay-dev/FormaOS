import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { getRecentItems } from '@/lib/search/recent-items';

export async function GET(req: NextRequest) {
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
}
