import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { checkAdminRateLimit, getClientIp } from '@/lib/ratelimit';
import { enqueueUserPurge, PurgeRefusedError } from '@/lib/admin/gdpr-purge';

// Audit 2026-05-26 — P0-8: admin endpoint that queues a GDPR Right-
// to-Erasure purge for a target user.
//
// Mirrors the shape of /api/admin/users/[userId]/revoke-sessions:
// CSRF, rate-limited, approval-gated, reason ≥ 8 chars, audit-logged.
// The actual cascade runs in the cron processor — this endpoint just
// validates + enqueues so the admin gets a job id back quickly.
//
// Refusal paths:
//   * 409 — user is the sole owner of one or more active orgs (caller
//     must transfer ownership first; the refusal is itself recorded in
//     user_purge_jobs for audit purposes).

type Params = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = await checkAdminRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const access = await requireAdminAccess({ permission: 'users:manage' });
    const { userId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);

    const reason = await requireAdminChangeControl({
      context: access,
      action: 'gdpr_user_purge',
      targetType: 'user',
      targetId: userId,
      reason: extractAdminReason(body, request),
      requireApproval: true,
    });

    let jobId: string;
    try {
      const result = await enqueueUserPurge({
        userId,
        requestedBy: access.user.id,
        reason,
        requestSource: 'admin',
      });
      jobId = result.jobId;
    } catch (err) {
      if (err instanceof PurgeRefusedError) {
        await logAdminAction({
          actorUserId: access.user.id,
          action: 'gdpr_user_purge_refused',
          targetType: 'user',
          targetId: userId,
          metadata: {
            reason,
            refuse_reason: err.message,
            details: err.details ?? null,
          },
        });
        return NextResponse.json(
          {
            error: err.message,
            details: err.details ?? null,
          },
          { status: 409 },
        );
      }
      throw err;
    }

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'gdpr_user_purge_enqueued',
      targetType: 'user',
      targetId: userId,
      metadata: {
        reason,
        job_id: jobId,
      },
    });

    return NextResponse.json({ ok: true, job_id: jobId });
  } catch (error) {
    return handleAdminError(error, '/api/admin/users/[userId]/gdpr-purge');
  }
}
