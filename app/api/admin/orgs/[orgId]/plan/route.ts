import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
import { getStripeClient, getStripePriceId } from '@/lib/billing/stripe';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/admin/orgs/[orgId]/plan');

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
      .select('status, stripe_subscription_id, plan_key')
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

    // P1-E (2026-05-26): round-trip the plan change to Stripe so the
    // customer is actually billed for the new tier. Without this, the
    // local plan_key + entitlements flip immediately but Stripe keeps
    // billing the old price until next manual resync — silent revenue
    // leakage on upgrades, free service on downgrades. Best-effort: a
    // Stripe failure is logged + audited but does not roll back the
    // local state (admins explicitly chose the new plan; ops can
    // reconcile via resync-stripe).
    let stripeUpdateOutcome:
      | 'updated'
      | 'no_stripe_subscription'
      | 'no_price_id'
      | 'unchanged'
      | 'failed' = 'no_stripe_subscription';
    const stripeSubscriptionId = subscription?.stripe_subscription_id ?? null;
    const previousPlan = subscription?.plan_key ?? null;
    if (stripeSubscriptionId) {
      const stripe = getStripeClient();
      const newPriceId = getStripePriceId(plan);
      if (!stripe) {
        stripeUpdateOutcome = 'failed';
        log.error(
          { orgId, plan },
          '[admin/plan] Stripe client unavailable — local plan changed without Stripe sync',
        );
      } else if (!newPriceId) {
        stripeUpdateOutcome = 'no_price_id';
        log.warn(
          { orgId, plan },
          '[admin/plan] no Stripe price configured for plan — local plan changed without Stripe sync',
        );
      } else if (previousPlan === plan) {
        stripeUpdateOutcome = 'unchanged';
      } else {
        try {
          const stripeSub =
            await stripe.subscriptions.retrieve(stripeSubscriptionId);
          const existingItemId = stripeSub.items.data[0]?.id;
          if (!existingItemId) {
            throw new Error('subscription has no items');
          }
          await stripe.subscriptions.update(stripeSubscriptionId, {
            items: [{ id: existingItemId, price: newPriceId }],
            proration_behavior: 'create_prorations',
            metadata: {
              ...(stripeSub.metadata ?? {}),
              plan_key: plan,
            },
          });
          stripeUpdateOutcome = 'updated';
        } catch (stripeErr) {
          stripeUpdateOutcome = 'failed';
          log.error(
            {
              err:
                stripeErr instanceof Error
                  ? stripeErr.message
                  : String(stripeErr),
              orgId,
              stripeSubscriptionId,
              plan,
            },
            '[admin/plan] Stripe subscription update failed — local plan changed without Stripe sync',
          );
        }
      }
    }

    // Bust the cached subscription state so the org's next /app load reflects
    // the new plan immediately rather than waiting on the 5-min cache TTL.
    revalidatePath('/app', 'layout');
    revalidatePath('/app/billing');

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'org_plan_update',
      targetType: 'organization',
      targetId: orgId,
      metadata: {
        plan,
        reason,
        previous_plan: previousPlan,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_update_outcome: stripeUpdateOutcome,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/plan');
  }
}
