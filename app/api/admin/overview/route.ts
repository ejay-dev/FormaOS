import { NextResponse } from 'next/server';
import { requireFounderAccess } from '@/app/app/admin/access';
import { getAdminOverviewMetrics } from '@/lib/admin/metrics-service';
import {
  ADMIN_CACHE_HEADERS,
} from '@/app/api/admin/_helpers';

export async function GET() {
  try {
    await requireFounderAccess();
    const metrics = await getAdminOverviewMetrics();

    return NextResponse.json(
      metrics,
      {
        headers: ADMIN_CACHE_HEADERS,
      },
    );
  } catch (error: any) {
    const msg = error?.message ?? '';
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unavailable (permission)' },
        { status: 403 },
      );
    }
    console.error('/api/admin/overview error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 500 });
  }
}
