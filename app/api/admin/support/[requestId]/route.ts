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
  params: Promise<{ requestId: string }>;
};

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
type SupportStatus = (typeof VALID_STATUSES)[number];

/**
 * PATCH /api/admin/support/[requestId]
 *
 * Update a support case: change status, assign owner, or add handoff notes.
 * Body: {
 *   status?: "open" | "in_progress" | "resolved" | "closed",
 *   assignedTo?: string (admin user email),
 *   notes?: string,
 *   reason?: string
 * }
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

    const access = await requireAdminAccess({ permission: 'support:manage' });
    const { requestId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);

    const admin = createSupabaseAdminClient();

    // Verify the support request exists
    const { data: supportRequest, error: fetchError } = await admin
      .from('support_requests')
      .select('id, status, email')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError || !supportRequest) {
      return NextResponse.json(
        { error: 'support_request_not_found' },
        { status: 404 },
      );
    }

    // Build the update payload — only apply fields that are provided
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body?.status != null) {
      const status = String(body.status).trim() as SupportStatus;
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `invalid_status_must_be_one_of_${VALID_STATUSES.join('_')}`,
          },
          { status: 400 },
        );
      }
      updates.status = status;
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (body?.assignedTo != null) {
      updates.assigned_to = String(body.assignedTo).trim() || null;
    }

    if (body?.notes != null) {
      updates.operator_notes = String(body.notes).trim() || null;
    }

    if (Object.keys(updates).length === 1) {
      // Only updated_at was set — nothing to change
      return NextResponse.json(
        { error: 'no_fields_to_update' },
        { status: 400 },
      );
    }

    await admin.from('support_requests').update(updates).eq('id', requestId);

    const reason = extractAdminReason(body, request);

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'support_case_update',
      targetType: 'support_request',
      targetId: requestId,
      metadata: {
        previousStatus: supportRequest.status,
        updates,
        reason,
      },
    });

    return NextResponse.json({ ok: true, requestId, updates });
  } catch (error) {
    return handleAdminError(error, '/api/admin/support/[requestId]');
  }
}
