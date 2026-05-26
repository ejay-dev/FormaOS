import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const log = routeLog('/api/v1/registers/breach/[id]/report');

const breachReportSchema = z.object({
  breach_id: z.string().trim().min(1).max(128).optional(),
  regulation: z.string().trim().min(1).max(200).optional(),
  action: z.string().trim().min(1).max(64).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const { id } = await params;
    if (!id)
      return NextResponse.json({ error: 'Missing breach id' }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { orgId } = ctx;

    const validation = await validateBody(request, breachReportSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;
    const breachId = body.breach_id ?? id;
    const regulation = body.regulation ?? 's912D Corporations Act 2001';
    const action = body.action ?? 'self-report';

    const { data: incident, error: fetchErr } = await supabase
      .from('org_incidents')
      .select('id, organization_id, notifications_sent, status')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (fetchErr || !incident) {
      log.error({ err: fetchErr, id }, 'incident not found');
      return NextResponse.json({ error: 'Breach not found' }, { status: 404 });
    }

    const existing = Array.isArray(incident.notifications_sent)
      ? (incident.notifications_sent as string[])
      : [];
    const notice = `ASIC ${regulation} (${action}) by ${user.email ?? user.id} @ ${new Date().toISOString()}`;
    const notifications = [...existing, notice];

    const { error: updateErr } = await supabase
      .from('org_incidents')
      .update({
        notifications_sent: notifications,
        reported_at: new Date().toISOString(),
        status:
          incident.status === 'resolved' || incident.status === 'closed'
            ? incident.status
            : 'investigating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (updateErr) {
      log.error({ err: updateErr }, 'failed to update incident');
      return NextResponse.json(
        { error: 'Failed to record report' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      breach_id: breachId,
      reported_at: new Date().toISOString(),
      regulation,
      action,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
