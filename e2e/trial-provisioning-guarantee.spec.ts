/**
 * Legacy Trialing Subscription Data Integrity
 *
 * Foundation self-serve checkout no longer creates Stripe trials
 * (see docs/billing-migration-plan.md §6). This suite covers the
 * historical `status = 'trialing'` code path that must remain
 * functional for grandfathered subscriptions so the entitlements
 * layer, trial-expiry windows, and cleanup paths still work
 * correctly when an admin or legacy webhook inserts a trialing
 * subscription.
 *
 * These tests manually insert trialing rows through the service
 * role client — they do NOT assert that a fresh signup now
 * produces a trial. New signups route through Stripe Checkout
 * with no trial period.
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  createMagicLinkSession,
  setPlaywrightSession,
} from './helpers/test-auth';

const APP_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const DAY_MS = 24 * 60 * 60 * 1000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

async function createTestUser(email: string): Promise<{ userId: string }> {
  if (!admin) throw new Error('Admin client not available');

  const password = `TestPass${Date.now()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      is_e2e_test: true,
      created_at: new Date().toISOString(),
    },
  });

  if (error) {
    const e = error as { name?: string; message?: string; status?: number };
    if (
      e.name === 'AuthRetryableFetchError' ||
      e.status === 0 ||
      e.message === '{}' ||
      e.message === ''
    ) {
      const networkErr = new Error(
        `SUPABASE_NETWORK_ERROR: ${e.name ?? 'AuthRetryableFetchError'}`,
      );
      (networkErr as any).isSupabaseNetworkError = true;
      throw networkErr;
    }
  }
  if (error || !data.user) {
    throw new Error(`Failed to create user: ${error?.message}`);
  }

  return { userId: data.user.id };
}

async function cleanupUser(userId: string) {
  if (!admin) return;

  try {
    const { data: membership } = await admin
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership?.organization_id) {
      const { error: entitlementsDeleteError } = await admin
        .from('org_entitlements')
        .delete()
        .eq('organization_id', membership.organization_id);
      if (entitlementsDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup org_entitlements failed:',
          entitlementsDeleteError.message,
        );
      }

      const { error: subscriptionsDeleteError } = await admin
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', membership.organization_id);
      if (subscriptionsDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup org_subscriptions failed:',
          subscriptionsDeleteError.message,
        );
      }

      const { error: membersDeleteError } = await admin
        .from('org_members')
        .delete()
        .eq('organization_id', membership.organization_id);
      if (membersDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup org_members failed:',
          membersDeleteError.message,
        );
      }

      const { error: organizationsDeleteError } = await admin
        .from('organizations')
        .delete()
        .eq('id', membership.organization_id);
      if (organizationsDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup organizations failed:',
          organizationsDeleteError.message,
        );
      }
    }

    await admin.auth.admin.deleteUser(userId).catch(() => null);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Provision a legacy grandfathered trialing org: organization + owner
 * membership + a `status = 'trialing'` subscription whose window is
 * anchored at `trialExpiresAt`.
 */
async function seedLegacyTrialOrg(options: {
  userId: string;
  trialStartedAt: Date;
  trialExpiresAt: Date;
}): Promise<{ id: string }> {
  const { data: org, error: orgError } = await admin!
    .from('organizations')
    .insert({ name: `Test Org ${Date.now()}`, plan_key: 'basic' })
    .select()
    .single();
  if (orgError || !org) {
    throw new Error(`Failed to create organization: ${orgError?.message}`);
  }
  await mirrorLegacyOrg(org as { id: string });

  const { error: memberError } = await admin!.from('org_members').insert({
    organization_id: org.id,
    user_id: options.userId,
    role: 'owner',
  });
  expect(memberError).toBeNull();

  const { error: subscriptionInsertError } = await admin!
    .from('org_subscriptions')
    .insert({
      org_id: org.id,
      organization_id: org.id,
      plan_code: 'starter',
      plan_key: 'basic',
      status: 'trialing',
      trial_started_at: options.trialStartedAt.toISOString(),
      trial_expires_at: options.trialExpiresAt.toISOString(),
    });
  expect(subscriptionInsertError).toBeNull();

  return org as { id: string };
}

async function signInAs(
  browserContext: BrowserContext,
  email: string,
): Promise<Page> {
  const page = await browserContext.newPage();
  const session = await createMagicLinkSession(email);
  await setPlaywrightSession(browserContext, session, APP_BASE);
  return page;
}

async function mirrorLegacyOrg(_org: { id: string; name?: string | null }) {
  // No-op since migration 20260624051 (R2 Phase B, commit 6126ab21)
  // dropped public.orgs after repointing every dependent FK to
  // organizations(id). Kept as a function so the call sites compile
  // without churn; safe to inline-delete once the next round of e2e
  // refactors runs.
}

test.describe('Legacy Trialing Subscription - Data Integrity', () => {
  test.beforeAll(async () => {
    if (!admin) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required',
      );
    }
  });

  test('Legacy trialing subscription inserted via admin client preserves entitlements', async () => {
    const email = `signup_${Date.now()}@test.formaos.local`;
    let userId: string;
    try {
      ({ userId } = await createTestUser(email));
    } catch (error) {
      if ((error as any).isSupabaseNetworkError) {
        test.skip(
          true,
          'Supabase admin API unavailable — skipping until Supabase recovers',
        );
        return;
      }
      throw error;
    }

    try {
      // Simulate a legacy grandfathered trialing subscription by inserting
      // the state directly via the service role client. New signups no longer
      // create trials, but the DB/entitlements layer must still handle this
      // state correctly for historical customers.
      const { data: org } = await admin!
        .from('organizations')
        .insert({
          name: `Test Org ${Date.now()}`,
          plan_key: 'basic',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create organization');
      await mirrorLegacyOrg(org);

      // Create membership
      await admin!.from('org_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

      // Create trial subscription (14 days)
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const { error: subscriptionInsertError } = await admin!
        .from('org_subscriptions')
        .insert({
          org_id: org.id,
          organization_id: org.id,
          plan_code: 'starter',
          plan_key: 'basic',
          status: 'trialing',
          trial_started_at: now.toISOString(),
          trial_expires_at: trialEnd.toISOString(),
        });
      expect(subscriptionInsertError).toBeNull();

      // Create basic entitlements
      const entitlements = [
        { feature_key: 'audit_export', enabled: true },
        { feature_key: 'reports', enabled: true },
        { feature_key: 'framework_evaluations', enabled: true },
        { feature_key: 'team_limit', enabled: true, limit_value: 15 },
      ];

      for (const ent of entitlements) {
        await admin!.from('org_entitlements').upsert({
          organization_id: org.id,
          feature_key: ent.feature_key,
          enabled: ent.enabled,
          ...(ent.limit_value ? { limit_value: ent.limit_value } : {}),
        });
      }

      // ✅ Verify complete setup
      // 1. Membership exists
      const { data: membership } = await admin!
        .from('org_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .maybeSingle();

      expect(membership?.organization_id).toBe(org.id);
      expect(membership?.role).toBe('owner');

      // 2. Subscription exists with correct duration
      const { data: subscription } = await admin!
        .from('org_subscriptions')
        .select('status, trial_started_at, trial_expires_at')
        .eq('organization_id', org.id)
        .maybeSingle();

      expect(subscription?.status).toBe('trialing');

      const startDate = new Date(subscription!.trial_started_at!).getTime();
      const endDate = new Date(subscription!.trial_expires_at!).getTime();
      const daysMs = endDate - startDate;
      const daysCount = Math.round(daysMs / (24 * 60 * 60 * 1000));

      expect(daysCount).toBe(14);

      // 3. Entitlements exist and enabled
      const { data: ents } = await admin!
        .from('org_entitlements')
        .select('feature_key, enabled')
        .eq('organization_id', org.id);

      const enabledFeatures = (ents ?? [])
        .filter((e) => e.enabled)
        .map((e) => e.feature_key);
      expect(enabledFeatures).toContain('audit_export');
      expect(enabledFeatures).toContain('reports');
      expect(enabledFeatures).toContain('framework_evaluations');
    } finally {
      await cleanupUser(userId);
    }
  });

  test('Trial window drives the /app billing gate: live trial passes, elapsed trial is sent to checkout', async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const liveEmail = `trial_live_${Date.now()}@test.formaos.local`;
    const expiredEmail = `trial_expired_${Date.now()}@test.formaos.local`;
    const { userId: liveUserId } = await createTestUser(liveEmail);
    const { userId: expiredUserId } = await createTestUser(expiredEmail);

    const liveBrowserContext = await browser.newContext();
    const expiredBrowserContext = await browser.newContext();

    try {
      const now = Date.now();

      // A trial that still has 13 days left.
      await seedLegacyTrialOrg({
        userId: liveUserId,
        trialStartedAt: new Date(now - DAY_MS),
        trialExpiresAt: new Date(now + 13 * DAY_MS),
      });

      // The same 14-day window, one day past its end.
      await seedLegacyTrialOrg({
        userId: expiredUserId,
        trialStartedAt: new Date(now - 15 * DAY_MS),
        trialExpiresAt: new Date(now - DAY_MS),
      });

      // The gate under test is the /app layout: `trialing` with a future
      // trial_expires_at is paid access, `trialing` past it is not.
      const livePage = await signInAs(liveBrowserContext, liveEmail);
      await livePage.goto(`${APP_BASE}/app`, {
        waitUntil: 'domcontentloaded',
      });
      await livePage.waitForLoadState('domcontentloaded');
      expect(new URL(livePage.url()).pathname).toBe('/app');

      const expiredPage = await signInAs(expiredBrowserContext, expiredEmail);
      await expiredPage.goto(`${APP_BASE}/app`, {
        waitUntil: 'domcontentloaded',
      });
      await expiredPage.waitForURL(/\/app\/billing/, { timeout: 45_000 });

      const redirected = new URL(expiredPage.url());
      expect(redirected.pathname).toBe('/app/billing');
      expect(redirected.searchParams.get('reason')).toBe('trial_expired');
      expect(redirected.searchParams.get('autoCheckout')).toBe('basic');
    } finally {
      await liveBrowserContext.close();
      await expiredBrowserContext.close();
      await cleanupUser(liveUserId);
      await cleanupUser(expiredUserId);
    }
  });

  test('Legacy trialing org has basic entitlements but not pro-only features', async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const email = `entitlements_${Date.now()}@test.formaos.local`;
    const { userId } = await createTestUser(email);
    const browserContext = await browser.newContext();

    try {
      const now = Date.now();
      const org = await seedLegacyTrialOrg({
        userId,
        trialStartedAt: new Date(now),
        trialExpiresAt: new Date(now + 14 * DAY_MS),
      });

      // Basic tier grants exactly these; `custom_reports` is Growth+.
      const basicFeatures = [
        'audit_export',
        'reports',
        'framework_evaluations',
      ];
      for (const feature of basicFeatures) {
        const { error: entitlementError } = await admin!
          .from('org_entitlements')
          .upsert({
            organization_id: org.id,
            feature_key: feature,
            enabled: true,
          });
        expect(entitlementError).toBeNull();
      }

      const page = await signInAs(browserContext, email);

      // The entitlement resolver — not the test — decides what this org
      // may reach. Without `custom_reports` the builder form must not be
      // rendered at all.
      await page.goto(`${APP_BASE}/app/reports/custom/new`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        page.getByTestId('custom-report-create-disabled'),
      ).toBeVisible();
      await expect(page.locator('form input#name')).toHaveCount(0);

      // Grant the pro-only entitlement and the same surface unlocks —
      // proving the assertion above tracks the entitlement, not a
      // permanently broken page.
      const { error: grantError } = await admin!
        .from('org_entitlements')
        .upsert({
          organization_id: org.id,
          feature_key: 'custom_reports',
          enabled: true,
        });
      expect(grantError).toBeNull();

      await page.goto(`${APP_BASE}/app/reports/custom/new`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('form input#name')).toBeVisible();
      await expect(
        page.getByTestId('custom-report-create-disabled'),
      ).toHaveCount(0);
    } finally {
      await browserContext.close();
      await cleanupUser(userId);
    }
  });
});
