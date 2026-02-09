import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { handleAdminError, ADMIN_CACHE_HEADERS } from '@/app/api/admin/_helpers';

export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    const [orgsResult, subsResult, plansResult] = await Promise.all([
      admin.from('organizations').select('id, created_at'),
      admin
        .from('org_subscriptions')
        .select(
          'organization_id, status, plan_key, current_period_end, trial_expires_at',
        ),
      admin.from('plans').select('key, price_cents'),
    ]);

    if (orgsResult.error || subsResult.error) {
      console.error('/api/admin/overview query errors:', {
        orgs: orgsResult.error,
        subs: subsResult.error,
      });
    }

    const orgs = orgsResult.data;
    const subscriptions = subsResult.data;
    const plans = plansResult.data;

    const totalOrgs = orgs?.length ?? 0;
    const planPriceMap = new Map<string, number>();
    (plans ?? []).forEach((plan: any) => {
      if (plan.price_cents) {
        planPriceMap.set(plan.key, plan.price_cents);
      }
    });

    const now = Date.now();
    const sevenDays = now + 7 * 24 * 60 * 60 * 1000;
    const planCounts: Record<string, number> = {};
    let trialsActive = 0;
    let trialsExpiring = 0;
    let failedPayments = 0;
    let mrrCents = 0;

    (subscriptions ?? []).forEach((subscription: any) => {
      const status = (subscription.status ?? '').toLowerCase();
      if (status === 'trialing') {
        trialsActive += 1;
        const trialEnd =
          subscription.trial_expires_at ?? subscription.current_period_end;
        if (trialEnd) {
          const trialEndMs = new Date(trialEnd).getTime();
          if (!Number.isNaN(trialEndMs) && trialEndMs <= sevenDays) {
            trialsExpiring += 1;
          }
        }
      }

      if (status === 'active') {
        const planKey = subscription.plan_key ?? 'unknown';
        planCounts[planKey] = (planCounts[planKey] ?? 0) + 1;
        const price = planPriceMap.get(planKey);
        if (price) {
          mrrCents += price;
        }
      }

      if (
        ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(
          status,
        )
      ) {
        failedPayments += 1;
      }
    });

    const dayCounts: Record<string, number> = {};
    (orgs ?? []).forEach((org: any) => {
      if (!org.created_at) return;
      const date = new Date(org.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      dayCounts[key] = (dayCounts[key] ?? 0) + 1;
    });

    const timeseries = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      return { date: key, count: dayCounts[key] ?? 0 };
    });

    return NextResponse.json(
      {
        totalOrgs,
        activeByPlan: planCounts,
        trialsActive,
        trialsExpiring,
        mrrCents,
        failedPayments,
        orgsByDay: timeseries,
        planPrices: Object.fromEntries(planPriceMap),
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error: any) {
    const msg = error?.message ?? '';
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unavailable (permission)' },
        { status: 403 },
      );
    }
    console.error('/api/admin/overview error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 500 });
  }
}
