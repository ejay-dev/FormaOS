import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { checkAdminRateLimit, getClientIp } from '@/lib/ratelimit';

type Params = {
  params: Promise<{ jobId: string }>;
};

/**
 * PATCH /api/admin/exports/[jobId]
 *
 * Operator action on an export job. Supported operations:
 *   action: "retry"  — re-queue a failed export job
 *   action: "cancel" — mark a stuck/processing job as cancelled
 *
 * Body: { action: "retry" | "cancel", type: "compliance" | "report", reason?: string }
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = await checkAdminRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const access = await requireAdminAccess({ permission: 'exports:manage' });
    const { jobId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);

    const action = String(body?.action ?? '').trim();
    if (action !== 'retry' && action !== 'cancel') {
      return NextResponse.json(
        { error: 'action_must_be_retry_or_cancel' },
        { status: 400 },
      );
    }

    const jobType = String(body?.type ?? '').trim();
    if (jobType !== 'compliance' && jobType !== 'report') {
      return NextResponse.json(
        { error: 'type_must_be_compliance_or_report' },
        { status: 400 },
      );
    }

    const reason = extractAdminReason(body, request) ?? `operator_${action}`;
    const table =
      jobType === 'compliance' ? 'compliance_export_jobs' : 'report_export_jobs';

    const admin = createSupabaseAdminClient();

    // Verify the job exists and check current status
    const { data: job, error: fetchError } = await admin
      .from(table)
      .select('id, status, organization_id')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'export_job_not_found' },
        { status: 404 },
      );
    }

    if (action === 'retry') {
      // Only failed jobs can be retried
      if (job.status !== 'failed' && job.status !== 'error') {
        return NextResponse.json(
          { error: `cannot_retry_job_with_status_${job.status}` },
          { status: 409 },
        );
      }

      await admin
        .from(table)
        .update({
          status: 'queued',
          progress: 0,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    } else {
      // Only queued or processing jobs can be cancelled
      if (job.status !== 'queued' && job.status !== 'processing') {
        return NextResponse.json(
          { error: `cannot_cancel_job_with_status_${job.status}` },
          { status: 409 },
        );
      }

      await admin
        .from(table)
        .update({
          status: 'cancelled',
          error_message: `Cancelled by operator: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    await logAdminAction({
      actorUserId: access.user.id,
      action: `export_${action}`,
      targetType: 'export_job',
      targetId: jobId,
      metadata: {
        jobType,
        previousStatus: job.status,
        newStatus: action === 'retry' ? 'queued' : 'cancelled',
        organizationId: job.organization_id,
        reason,
      },
    });

    return NextResponse.json({ ok: true, action, jobId });
  } catch (error) {
    return handleAdminError(error, '/api/admin/exports/[jobId]');
  }
}
