import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { scheduleReport, unscheduleReport } from '@/lib/reports/scheduler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:write'],
    });
    if (!auth.ok) return auth.response;

    const { reportId } = await params;
    const body = await req.json();

    const frequency = body.frequency;
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'frequency must be daily, weekly, or monthly' },
        { status: 400 },
      );
    }

    const db = createSupabaseAdminClient();
    const result = await scheduleReport(db, reportId, auth.context.orgId, {
      frequency,
      recipients: body.recipients ?? [],
      format: body.format ?? 'json',
      dayOfWeek: body.dayOfWeek,
      dayOfMonth: body.dayOfMonth,
      hour: body.hour ?? 8,
    });

    if (!result)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:write'],
    });
    if (!auth.ok) return auth.response;

    const { reportId } = await params;

    const db = createSupabaseAdminClient();
    await unscheduleReport(db, reportId, auth.context.orgId);

    return NextResponse.json({ unscheduled: true });
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
