import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
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

    const access = await requireAdminAccess({ permission: 'billing:manage' });
    const { orgId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);
    const planRaw = String(body?.plan ?? '');
    const plan = resolvePlanKey(planRaw);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const reason = await requireAdminChangeControl({
      context: access,
      action: 'org_plan_update',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
    });

    const now = new Date().toISOString();
    const admin = createSupabaseAdminClient();
    await admin
      .from('organizations')
      .update({ plan_key: plan, plan_selected_at: now })
      .eq('id', orgId);

    const { data: subscription } = await admin
      .from('org_subscriptions')
      .select('status')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (subscription?.status) {
      await admin
        .from('org_subscriptions')
        .update({ plan_key: plan, updated_at: now })
        .eq('organization_id', orgId);
    } else {
      // Admin-assigned plans bypass the self-serve checkout gate — admins
      // grant access on behalf of the customer (typically enterprise / contracted).
      await ensureSubscription(orgId, plan, { intent: 'active' });
    }

    await syncEntitlementsForPlan(orgId, plan);

    // Bust the cached subscription state so the org's next /app load reflects
    // the new plan immediately rather than waiting on the 5-min cache TTL.
    revalidatePath('/app', 'layout');
    revalidatePath('/app/billing');

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'org_plan_update',
      targetType: 'organization',
      targetId: orgId,
      metadata: { plan, reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/plan');
  }
}
