import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
import { logAdminAction } from '@/lib/admin/audit';
import { handleAdminError } from '@/app/api/admin/_helpers';

type Params = {
  params: Promise<{ orgId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { user } = await requireFounderAccess();
    const { orgId } = await params;
    const contentType = request.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await request.json().catch(() => ({}))
      : Object.fromEntries(await request.formData());
    const planRaw = String(body?.plan ?? '');
    const plan = resolvePlanKey(planRaw);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

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
      await ensureSubscription(orgId, plan);
    }

    if (plan === 'basic' || plan === 'pro') {
      await syncEntitlementsForPlan(orgId, plan);
    }

    await logAdminAction({
      actorUserId: user.id,
      action: 'org_plan_update',
      targetType: 'organization',
      targetId: orgId,
      metadata: { plan },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/plan');
  }
}
