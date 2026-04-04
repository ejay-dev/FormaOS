import { NextResponse } from 'next/server';
import { getActivityFeed } from '@/lib/activity/feed';
import { requireNotificationContext } from '@/lib/notifications/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const text =
            typeof value === 'string' ? value : JSON.stringify(value ?? '');
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ];
  return lines.join('\n');
}

export async function GET(request: Request) {
  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const { searchParams } = new URL(request.url);
    const context = await requireNotificationContext(searchParams.get('orgId'));
    const format = searchParams.get('format');
    const result = await getActivityFeed(context.orgId, {
      cursor: searchParams.get('cursor'),
      limit: Number(searchParams.get('limit') ?? '25') || 25,
      filters: {
        action: searchParams.get('action') || undefined,
        actorId: searchParams.get('actorId') || undefined,
        resourceType: searchParams.get('resourceType') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
      },
    });

    if (format === 'csv') {
      const csv = toCsv(
        result.items.map((item) => ({
          created_at: item.created_at,
          actor_name: item.actor_name ?? item.actor_email ?? 'System',
          action: item.action,
          resource_type: item.resource_type,
          resource_name: item.resource_name ?? '',
          resource_id: item.resource_id ?? '',
          metadata: JSON.stringify(item.metadata ?? {}),
        })),
      );

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="activity-feed.csv"',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load activity',
      },
      { status: 500 },
    );
  }
}
