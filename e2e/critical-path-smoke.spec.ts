import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import {
  cleanupTestUser,
  createMagicLinkSession,
  setPlaywrightSession,
} from './helpers/test-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

type OrphanUser = {
  id: string;
  email: string;
  password: string;
  orgId?: string;
};

async function createOrphanUser(): Promise<OrphanUser> {
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for orphan user setup');
  }

  const testId = `orphan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const email = `${testId}@test.formaos.local`;
  const password = `TestPass${testId}!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      is_e2e_test: true,
      created_at: new Date().toISOString(),
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create orphan user: ${error?.message}`);
  }

  return { id: data.user.id, email, password };
}

async function cleanupOrphanUser(user: OrphanUser | null) {
  if (!admin || !user) return;

  if (user.orgId) {
    await admin.from('org_subscriptions').delete().eq('organization_id', user.orgId);
    await admin.from('org_members').delete().eq('organization_id', user.orgId);
    await admin.from('organizations').delete().eq('id', user.orgId);
  }

  await admin.auth.admin.deleteUser(user.id);
}

const appBase =
  process.env.PLAYWRIGHT_APP_BASE ?? 'https://app.formaos.com.au';
const siteBase =
  process.env.PLAYWRIGHT_SITE_BASE ?? 'https://www.formaos.com.au';

async function signInWithMagicLink(page: any, email: string, expectedUrl?: RegExp) {
  const session = await createMagicLinkSession(email);
  await setPlaywrightSession(page.context(), session, appBase);
  await page.goto(`${appBase}/auth/signin`, { waitUntil: 'domcontentloaded' });
  if (expectedUrl) {
    await page.waitForURL(expectedUrl, { timeout: 20_000 });
    return;
  }
  await page.waitForURL(/\/(app|onboarding)/, { timeout: 20_000 });
}


test.describe.serial('Critical Path Smoke', () => {
  let orphanUser: OrphanUser | null = null;
  test.beforeAll(async () => {
    if (!admin) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for critical-path tests',
      );
    }
    orphanUser = await createOrphanUser();
  });

  test.afterAll(async () => {
    await cleanupOrphanUser(orphanUser);
    await cleanupTestUser();
  });

  test('Marketing CTA → Auth → Google OAuth redirect wiring', async ({ page }) => {
    await page.goto(siteBase, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('text=/Start.*Trial|Get.*Started/i').first();
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/auth\/(signup|signin)|\/signin|\/signup/);

    const googleBtn = page.locator(
      'button:has-text("Google"), button:has-text("google"), [data-testid="google-signin-btn"]',
    );
    await expect(googleBtn.first()).toBeVisible({ timeout: 10_000 });

    const [request] = await Promise.all([
      page.waitForRequest((req) => {
        const url = req.url();
        return (
          url.includes('supabase.co/auth/v1/authorize') ||
          url.includes('accounts.google.com/o/oauth2')
        );
      }),
      googleBtn.first().click(),
    ]);

    const redirectUrl = request.url();
    expect(
      redirectUrl.includes('supabase.co/auth/v1/authorize') ||
        redirectUrl.includes('accounts.google.com/o/oauth2'),
    ).toBe(true);
  });

  test('New user → onboarding + trial provisioning → dashboard → logout/login', async ({
    page,
  }) => {
    if (!orphanUser) throw new Error('Missing orphan user');
    await signInWithMagicLink(page, orphanUser.email, /\/onboarding/);
    await expect(page).toHaveURL(/\/onboarding/);

    // Verify org + trial + entitlements provisioning
    const { data: membership } = await admin!
      .from('org_members')
      .select('organization_id')
      .eq('user_id', orphanUser.id)
      .maybeSingle();

    expect(membership?.organization_id).toBeTruthy();
    orphanUser.orgId = membership?.organization_id;

    const { data: subscription } = await admin!
      .from('org_subscriptions')
      .select('status')
      .eq('organization_id', orphanUser.orgId)
      .maybeSingle();

    expect(['trialing', 'active']).toContain(subscription?.status);

    const { data: entitlements } = await admin!
      .from('org_entitlements')
      .select('id')
      .eq('organization_id', orphanUser.orgId);

    expect((entitlements ?? []).length).toBeGreaterThan(0);

    // Mark onboarding complete to validate dashboard access
    await admin!
      .from('organizations')
      .update({
        onboarding_completed: true,
        industry: 'healthcare',
        team_size: '1-10',
        frameworks: ['ISO27001'],
      })
      .eq('id', orphanUser.orgId);

    await page.goto(`${appBase}/app`, { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/auth\/signin/);

    const routes = [
      '/app',
      '/app/participants',
      '/app/visits',
      '/app/progress-notes',
      '/app/incidents',
      '/app/staff-compliance',
      '/app/team',
      '/app/registers',
      '/app/vault',
      '/app/reports',
      '/app/executive',
      '/app/settings',
      '/app/care-plans',
      '/app/policies',
      '/app/tasks',
      '/app/people',
      '/app/patients',
      '/app/audit',
      '/app/settings/email-preferences',
      '/app/staff',
      '/app/profile',
      '/app/billing',
      '/app/certificates',
    ];

    for (const route of routes) {
      const response = await page.goto(`${appBase}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      const is404 = response?.status() === 404;
      const hasNotFoundText = await page
        .locator('text=This page could not be found')
        .isVisible()
        .catch(() => false);

      expect(
        is404 || hasNotFoundText,
        `Route ${route} returned 404 or showed "not found" text`,
      ).toBe(false);
    }

    await page.goto(`${appBase}/auth/signout`);
    await page.waitForURL(/\/auth\/signin/, { timeout: 10_000 });

    await signInWithMagicLink(page, orphanUser.email, /\/app/);

    const url = page.url();
    expect(url).not.toContain('__rl=');
  });
});
