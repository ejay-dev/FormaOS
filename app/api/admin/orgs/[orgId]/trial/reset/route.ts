import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    // v4-018: same guard as /trial/extend — a paid sub can't be
    // reset to `trialing` by an admin action without first
    // cancelling the Stripe subscription.
    const { data: existing } = await admin
      .from('org_subscriptions')
      .select('status, stripe_subscription_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (
      existing &&
      ['active', 'past_due'].includes(String(existing.status)) &&
      existing.stripe_subscription_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'paid_subscription_cannot_be_trialed',
          message:
            'Org has an active paid Stripe subscription. Cancel or migrate it before resetting a trial.',
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await admin.from('org_subscriptions').upsert(
      {
        organization_id: orgId,
        status: 'trialing',
        trial_started_at: now.toISOString(),
        trial_expires_at: expiresAt,
        current_period_end: expiresAt,
        updated_at: now.toISOString(),
      },
      { onConflict: 'organization_id' },
    );

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'trial_reset',
      targetType: 'organization',
      targetId: orgId,
      metadata: { reason },
    });

    // Bust the layout-level system-state cache so the affected org's /app
    // sees the reset trial state on next load.
    revalidatePath('/app', 'layout');
    revalidatePath(`/admin/orgs/${orgId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/trial/reset');
  }
}
