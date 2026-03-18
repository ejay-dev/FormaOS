import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';

type Params = {
  params: Promise<{ orgId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const access = await requireAdminAccess({ permission: 'trials:manage' });
    const { orgId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);
    const reason = await requireAdminChangeControl({
      context: access,
      action: 'trial_reset',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
      requireApproval: true,
    });
    const admin = createSupabaseAdminClient();

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await admin.from('org_subscriptions').upsert({
      organization_id: orgId,
      status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_expires_at: expiresAt,
      current_period_end: expiresAt,
      updated_at: now.toISOString(),
    });

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'trial_reset',
      targetType: 'organization',
      targetId: orgId,
      metadata: { reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/trial/reset');
  }
}
