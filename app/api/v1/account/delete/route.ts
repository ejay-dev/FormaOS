import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { getStripeClient } from '@/lib/billing/stripe';

// Audit 2026-05-25 (GDPR): self-serve account deletion. The endpoint is
// guarded by CSRF + rate-limit + a body-confirmation field
// (`confirm === 'DELETE'`). Sole-ownership of an org with other members
// is a hard block — the caller is told to transfer ownership first.
//
// Effects on success:
//  - Cancels Stripe subscriptions for any org that will be orphaned by
//    this deletion (the sole-member case)
//  - Removes the user's `org_members` rows (CASCADE wipes per-user data
//    scoped through that membership)
//  - Deletes the `user_security` and `user_profiles` rows
//  - Deletes the Supabase auth user (Article 17 erasure)
//
// Multi-member orgs the user is NOT the sole member of are left alone —
// the remaining members continue to use the org and its subscription.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = routeLog('/api/v1/account/delete');

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rateLimit = await rateLimitApi(request, user.id);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 60) } },
    );
  }

  let body: { confirm?: unknown } = {};
  try {
    body = (await request.json()) as { confirm?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'invalid_body' },
      { status: 400 },
    );
  }

  if (body.confirm !== 'DELETE') {
    return NextResponse.json(
      {
        error: 'confirmation_required',
        message:
          'POST { "confirm": "DELETE" } to acknowledge that this action is irreversible.',
      },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  // Sole-owner-of-multi-member-org guard.
  try {
    const { data: memberships, error: membershipErr } = await admin
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id);

    if (membershipErr) throw membershipErr;

    const ownerOrgs = (memberships ?? []).filter(
      (m: { role?: string | null }) =>
        (m.role ?? '').toLowerCase() === 'owner',
    );

    for (const m of ownerOrgs) {
      const orgId = (m as { organization_id: string }).organization_id;
      const { count, error: countErr } = await admin
        .from('org_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .neq('user_id', user.id);
      if (countErr) throw countErr;
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          {
            error: 'sole_owner_with_members',
            message:
              'You are the sole owner of an organization that still has other members. Transfer ownership in /app/settings/roles or remove the members before deleting your account.',
            organization_id: orgId,
          },
          { status: 409 },
        );
      }
    }
  } catch (err) {
    log.error({ err, userId: user.id }, 'sole-owner guard failed');
    return NextResponse.json(
      { error: 'precheck_failed' },
      { status: 500 },
    );
  }

  // Identify orgs that will be orphaned (sole-member) so we can cancel
  // their Stripe subscriptions before erasing the auth user. Multi-member
  // orgs the user is NOT the sole member of are left alone — the
  // remaining members keep the subscription.
  const cascadedOrgIds: string[] = [];
  try {
    const { data: orgs } = await admin
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id);
    for (const m of orgs ?? []) {
      const orgId = (m as { organization_id: string }).organization_id;
      const { count } = await admin
        .from('org_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .neq('user_id', user.id);
      if ((count ?? 0) === 0) {
        cascadedOrgIds.push(orgId);
      }
    }
  } catch (err) {
    log.warn({ err, userId: user.id }, 'orphan-org detection partial');
  }

  // Cancel Stripe subscriptions for orphaned orgs. Best-effort: a Stripe
  // failure must not block the GDPR erasure (Article 17 is time-bound), so
  // we log + push the orgId/subId/customerId into the activity feed for
  // the billing reconciler to reconcile out-of-band.
  const stripe = getStripeClient();
  const stripeCancellations: Array<{
    orgId: string;
    subscriptionId: string | null;
    customerId: string | null;
    status: 'cancelled' | 'no_subscription' | 'no_stripe_client' | 'failed';
  }> = [];

  for (const orgId of cascadedOrgIds) {
    let subscriptionId: string | null = null;
    let customerId: string | null = null;
    try {
      const { data: sub } = await admin
        .from('org_subscriptions')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('organization_id', orgId)
        .maybeSingle<{
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
        }>();
      subscriptionId = sub?.stripe_subscription_id ?? null;
      customerId = sub?.stripe_customer_id ?? null;
    } catch (err) {
      log.warn({ err, orgId }, 'pre-cancel: failed to read org_subscriptions');
    }

    if (!subscriptionId) {
      stripeCancellations.push({
        orgId,
        subscriptionId,
        customerId,
        status: 'no_subscription',
      });
      continue;
    }

    if (!stripe) {
      // Stripe credentials missing — record the gap so the reconciler can
      // close it on next run. Production deployments fail closed here in
      // the sense that the row state is preserved for audit, not that the
      // user's erasure is blocked.
      log.warn(
        { orgId, subscriptionId },
        'stripe-cancel: no client configured — deferring',
      );
      stripeCancellations.push({
        orgId,
        subscriptionId,
        customerId,
        status: 'no_stripe_client',
      });
      continue;
    }

    try {
      await stripe.subscriptions.cancel(subscriptionId, {
        invoice_now: false,
        prorate: false,
      });

      // Audit 2026-05-26 — also delete the Stripe customer when this
      // org is being abandoned by its last member. Leaving the
      // customer behind kept orphan billing entities around forever
      // and the reconciler's `customer.deleted` branch (added below)
      // would otherwise have nothing to react to.
      if (customerId) {
        try {
          await stripe.customers.del(customerId);
        } catch (custErr) {
          log.warn(
            { custErr, orgId, customerId },
            'stripe-cancel: customer delete failed (sub already cancelled)',
          );
        }
      }
      try {
        await admin
          .from('org_subscriptions')
          // American spelling to match calculateModuleState / RECOVERABLE_STATES
          // (audit: canceled-normalization). The report enum below keeps its
          // own 'cancelled' literal — that's an API response value, not the
          // subscription status column.
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId);
      } catch (dbErr) {
        log.warn(
          { dbErr, orgId, subscriptionId },
          'stripe-cancel: cancelled in Stripe but local status update failed',
        );
      }
      stripeCancellations.push({
        orgId,
        subscriptionId,
        customerId,
        status: 'cancelled',
      });
    } catch (err) {
      log.error({ err, orgId, subscriptionId }, 'stripe-cancel failed');
      stripeCancellations.push({
        orgId,
        subscriptionId,
        customerId,
        status: 'failed',
      });
    }
  }

  // Best-effort: emit a final activity entry per cascaded org so the
  // billing reconciler has a breadcrumb. Do this BEFORE the deletion so
  // the org row + activity table still exist when we write.
  for (const orgId of cascadedOrgIds) {
    const cancelRecord = stripeCancellations.find((r) => r.orgId === orgId);
    try {
      await logProductActivity(
        orgId,
        user.id,
        'deleted',
        {
          type: 'account',
          id: user.id,
          name: user.email ?? user.id,
          path: '/app/privacy',
        },
        {
          reason: 'gdpr_self_serve_account_deletion',
          cascaded_org: true,
          stripe_subscription_id: cancelRecord?.subscriptionId ?? null,
          stripe_customer_id: cancelRecord?.customerId ?? null,
          stripe_cancellation_status: cancelRecord?.status ?? 'unknown',
        },
      );
    } catch (err) {
      // Don't block the deletion on a missing activity table.
      log.warn(
        { err, userId: user.id, orgId },
        'pre-deletion activity log failed',
      );
    }
  }

  try {
    // user_security + user_profiles are NOT covered by org_members CASCADE
    // because their FKs land on auth.users (or are referenced by user_id
    // directly). The auth.admin.deleteUser call below cascades from
    // auth.users → both tables, but doing it explicitly first means a
    // partial failure leaves no plaintext-secret-bearing rows behind.
    await admin.from('user_security').delete().eq('user_id', user.id);
    await admin.from('user_profiles').delete().eq('user_id', user.id);
    await admin.from('org_members').delete().eq('user_id', user.id);

    // Audit 2026-05-26 — hard-delete orgs whose only remaining member
    // was this user. Previously the org row stayed forever (still
    // visible in admin lists, MRR rollups, customer-health), with
    // status='cancelled' on org_subscriptions but no actual customer.
    // CASCADE on organizations(id) handles org_subscriptions,
    // org_entitlements, org_audit_log, etc.
    if (cascadedOrgIds.length > 0) {
      try {
        await admin
          .from('organizations')
          .delete()
          .in('id', cascadedOrgIds);
      } catch (orgErr) {
        log.warn(
          { err: orgErr, cascadedOrgIds },
          'orphan-org cleanup failed (user already deleted, run reconciler)',
        );
      }
    }

    const { error: authDeleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (authDeleteErr) throw authDeleteErr;
  } catch (err) {
    log.error({ err, userId: user.id }, 'account deletion failed');
    return NextResponse.json(
      { error: 'deletion_failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    cascaded_orgs: cascadedOrgIds,
    stripe_cancellations: stripeCancellations,
  });
}
