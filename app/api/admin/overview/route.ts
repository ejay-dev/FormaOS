import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/app/app/admin/access';
import { getAdminOverviewMetrics } from '@/lib/admin/metrics-service';
import { routeLog } from '@/lib/monitoring/server-logger';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { ADMIN_CACHE_HEADERS } from '@/app/api/admin/_helpers';

const log = routeLog('/api/admin/overview');

export async function GET(request: Request) {
  try {
    const { user } = await requireAdminAccess({ permission: 'dashboard:view' });
    const rate = await rateLimitApi(request, user.id);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const metrics = await getAdminOverviewMetrics();

    return NextResponse.json(metrics, {
      headers: ADMIN_CACHE_HEADERS,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message ?? '';
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unavailable (permission)' },
        { status: 403 },
      );
    }
    log.error({ err: error }, '/api/admin/overview error:');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 500 });
  }
}
