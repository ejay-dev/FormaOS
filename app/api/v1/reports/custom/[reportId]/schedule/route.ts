import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { scheduleReport, unscheduleReport } from '@/lib/reports/scheduler';
import { requireCustomReportsEntitlement } from '../../_entitlement';
import {
  emailSchema,
  formatZodError,
  validateBody,
} from '@/lib/security/api-validation';

const scheduleReportSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(emailSchema).max(100).optional().default([]),
  // scheduleReport's helper accepts only the file formats below;
  // 'json' was a pre-Zod option that the helper would reject anyway.
  format: z.enum(['pdf', 'csv', 'xlsx']).optional().default('pdf'),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  hour: z.number().int().min(0).max(23).optional().default(8),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:write'],
    });
    if (!auth.ok) return auth.response;
    const entitlementError = await requireCustomReportsEntitlement(auth.context);
    if (entitlementError) return entitlementError;

    const { reportId } = await params;
    const validation = await validateBody(req, scheduleReportSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

    const db = createSupabaseAdminClient();
    const result = await scheduleReport(db, reportId, auth.context.orgId, {
      frequency: body.frequency,
      recipients: body.recipients,
      format: body.format,
      dayOfWeek: body.dayOfWeek,
      dayOfMonth: body.dayOfMonth,
      hour: body.hour,
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
    const entitlementError = await requireCustomReportsEntitlement(auth.context);
    if (entitlementError) return entitlementError;

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
