import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { scheduleReport, unscheduleReport } from '@/lib/reports/scheduler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['reports:write'],
  });
  if ('error' in auth) return auth.error;

  const { reportId } = await params;
  const body = await req.json();

  const frequency = body.frequency;
  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    return jsonWithContext(
      { error: 'frequency must be daily, weekly, or monthly' },
      400,
    );
  }

  const result = await scheduleReport(reportId, auth.orgId, {
    frequency,
    recipients: body.recipients ?? [],
    format: body.format ?? 'json',
    dayOfWeek: body.dayOfWeek,
    dayOfMonth: body.dayOfMonth,
    time: body.time ?? '08:00',
  });

  if (!result) return jsonWithContext({ error: 'Report not found' }, 404);

  logV1Access(auth, 'reports.schedule', { reportId, frequency });
  return jsonWithContext(result);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['reports:write'],
  });
  if ('error' in auth) return auth.error;

  const { reportId } = await params;

  const result = await unscheduleReport(reportId, auth.orgId);
  if (!result) return jsonWithContext({ error: 'Report not found' }, 404);

  logV1Access(auth, 'reports.unschedule', { reportId });
  return jsonWithContext({ unscheduled: true });
}
