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

    // v4-018: refuse to overwrite a live paid sub with `trialing`.
    // The previous upsert silently downgraded any active customer
    // to a trial state when a founder hit "Extend trial" on the
    // wrong row, breaking entitlements + Stripe state drift.
    const { data: existing } = await admin
      .from('org_subscriptions')
      .select('status, plan_key, stripe_subscription_id')
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
            'Org has an active paid Stripe subscription. Cancel or migrate it before extending a trial.',
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + days * 24 * 60 * 60 * 1000,
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
      action: 'trial_extend',
      targetType: 'organization',
      targetId: orgId,
      metadata: { days, reason },
    });

    // Bust the layout-level system-state cache so the affected org's /app
    // sees the new trial expiry on next load instead of the stale value.
    revalidatePath('/app', 'layout');
    revalidatePath(`/admin/orgs/${orgId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/trial/extend');
  }
}
