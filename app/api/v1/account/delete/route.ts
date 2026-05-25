import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { logActivity as logProductActivity } from '@/lib/activity/feed';

// Audit 2026-05-25 (GDPR): self-serve account deletion. The endpoint is
// guarded by CSRF + rate-limit + a body-confirmation field
// (`confirm === 'DELETE'`). Sole-ownership of an org with other members
// is a hard block — the caller is told to transfer ownership first.
//
// Effects on success:
//  - Removes the user's `org_members` rows (CASCADE wipes per-user data
//    scoped through that membership)
//  - Deletes the `user_security` and `user_profiles` rows
//  - Deletes the Supabase auth user (Article 17 erasure)
//
// Stripe customer-side cancellation is deferred: org subscriptions live
// at the org level and remain active until the org owner closes them
// (typical case: the org continues with the remaining members). When the
// deletion ALSO cascades the org (sole-member case), we log the org_id +
// stripe_customer_id so the billing reconciler can close it.

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

  // Identify orgs that will be orphaned (sole-member) so we can audit-log
  // their stripe_customer_id for downstream billing closure.
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

  // Best-effort: emit a final activity entry per cascaded org so the
  // billing reconciler has a breadcrumb. Do this BEFORE the deletion so
  // the org row + activity table still exist when we write.
  for (const orgId of cascadedOrgIds) {
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
  });
}
