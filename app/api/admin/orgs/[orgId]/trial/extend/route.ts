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
    const daysRaw = Number(body?.days ?? 14);
    const days = Number.isFinite(daysRaw)
      ? Math.max(1, Math.min(90, daysRaw))
      : 14;
    const reason = await requireAdminChangeControl({
      context: access,
      action: 'trial_extend',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
    });

    const admin = createSupabaseAdminClient();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + days * 24 * 60 * 60 * 1000,
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
      action: 'trial_extend',
      targetType: 'organization',
      targetId: orgId,
      metadata: { days, reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/trial/extend');
  }
}
