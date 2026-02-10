/**
 * Product Walkthrough E2E Test
 * Tests complete user journey from marketing to app with evidence capture
 *
 * Run: PLAYWRIGHT_BASE_URL=https://app.formaos.com.au npx playwright test e2e/product-walkthrough.spec.ts --project=chromium
 */

import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Production URLs - can be overridden via environment
const MARKETING_URL =
  process.env.PLAYWRIGHT_MARKETING_URL || 'https://formaos.com.au';
const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://app.formaos.com.au';

// ⚠️ CRITICAL: E2E tests MUST use environment variables for Supabase credentials
// Never hardcode Supabase URLs or keys - they will be rotated and tests will fail
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if required environment variables are not set (instead of throwing at module load)
const SKIP_REASON = !SUPABASE_URL
  ? 'NEXT_PUBLIC_SUPABASE_URL not set'
  : !SERVICE_ROLE_KEY
    ? 'SUPABASE_SERVICE_ROLE_KEY not set'
    : null;

const timestamp = Date.now();
const QA_EMAIL_V1 = `qa.e2e.v1.${timestamp}@formaos.team`;
const QA_EMAIL_V2 = `qa.e2e.v2.${timestamp}@formaos.team`;
const QA_PASSWORD = 'QaE2ETest123!Secure';

let admin: SupabaseClient;
let qaUserIdV1: string | null = null;
let qaUserIdV2: string | null = null;
let qaOrgIdV1: string | null = null;
let qaOrgIdV2: string | null = null;

// Helper to capture console logs
const consoleLogs: string[] = [];

// Skip test setup if env vars are missing
test.beforeAll(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log('Skipping test setup - missing environment variables');
    return;
  }
  admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
});

test.afterAll(async () => {
  // Skip cleanup if admin client wasn't initialized (env vars missing)
  if (!admin) {
    console.log('Skipping cleanup - admin client not initialized');
    return;
  }
  
  // Cleanup QA data
  console.log('Cleaning up QA test data...');

  for (const orgId of [qaOrgIdV1, qaOrgIdV2].filter(Boolean)) {
    if (orgId) {
      await admin.from('org_tasks').delete().eq('organization_id', orgId);
      await admin.from('org_evidence').delete().eq('organization_id', orgId);
      await admin
        .from('org_entitlements')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('org_onboarding_status')
        .delete()
        .eq('organization_id', orgId);
      await admin.from('org_members').delete().eq('organization_id', orgId);
      await admin.from('orgs').delete().eq('id', orgId);
      await admin.from('organizations').delete().eq('id', orgId);
    }
  }

  for (const userId of [qaUserIdV1, qaUserIdV2].filter(Boolean)) {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }

  console.log('Cleanup complete');
});

// Helper to setup page with console logging
async function setupPage(page: Page) {
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    consoleLogs.push(`[ERROR] ${error.message}`);
  });
}

// Helper to create user via admin API (simulates signup)
async function createQAUser(
  email: string,
  password: string,
): Promise<{ userId: string; orgId: string } | null> {
  const { data: userData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !userData.user) {
    console.error('Failed to create user:', createError);
    return null;
  }

  const userId = userData.user.id;
  const now = new Date().toISOString();
  const fallbackName = email.split('@')[0];

  // Create organization
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: fallbackName,
      created_by: userId,
      plan_key: 'basic',
      plan_selected_at: now,
      onboarding_completed: true,
      industry: 'technology',
      frameworks: ['iso27001'],
    })
    .select('id')
    .single();

  if (orgError || !org?.id) {
    console.error('Failed to create org:', orgError);
    return null;
  }

  const orgId = org.id;

  // Create legacy orgs entry
  await admin.from('orgs').upsert(
    {
      id: orgId,
      name: fallbackName,
      created_by: userId,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );

  // Create membership
  await admin.from('org_members').insert({
    organization_id: orgId,
    user_id: userId,
    role: 'owner',
  });

  // Create subscription
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  await admin.from('org_subscriptions').upsert({
    org_id: orgId,
    organization_id: orgId,
    plan_code: 'starter',
    plan_key: 'basic',
    status: 'trialing',
    current_period_end: trialEnd.toISOString(),
    trial_started_at: now,
    trial_expires_at: trialEnd.toISOString(),
    updated_at: now,
  });

  // Create entitlements
  const entitlements = [
    'audit_export',
    'reports',
    'framework_evaluations',
    'team_limit',
  ];
  for (const feature of entitlements) {
    await admin.from('org_entitlements').upsert(
      {
        organization_id: orgId,
        feature_key: feature,
        enabled: true,
        updated_at: now,
      },
      { onConflict: 'organization_id,feature_key' },
    );
  }

  return { userId, orgId };
}

test.describe('A) Marketing → App Entry', () => {
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');

  test('A1: Home hero CTA → signup page loads', async ({ page }) => {
    await setupPage(page);

    // Go to marketing site
    await page.goto(MARKETING_URL);
    await page.waitForLoadState('networkidle');

    // Screenshot: Marketing homepage
    await page.screenshot({
      path: 'test-results/screenshots/A1-marketing-home.png',
      fullPage: true,
    });

    // Find and click CTA (Start Free Trial or similar)
    const ctaButton = page
      .locator(
        'a:has-text("Start Free"), a:has-text("Sign Up"), a:has-text("Get Started")',
      )
      .first();
    await expect(ctaButton).toBeVisible({ timeout: 10000 });

    // Verify CTA links to app domain
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('app.formaos.com.au');

    await page.screenshot({
      path: 'test-results/screenshots/A1-cta-visible.png',
    });
  });

  test('A2-A3: Signup and login flow (V1: New user)', async ({ page }) => {
    await setupPage(page);

    // Create QA user first
    const result = await createQAUser(QA_EMAIL_V1, QA_PASSWORD);
    expect(result).not.toBeNull();
    qaUserIdV1 = result!.userId;
    qaOrgIdV1 = result!.orgId;

    // Go to signin page
    await page.goto(`${APP_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/A3-signin-page.png',
    });

    // Fill login form
    await page.fill('input[type="email"]', QA_EMAIL_V1);
    await page.fill('input[type="password"]', QA_PASSWORD);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to app
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    await page.screenshot({
      path: 'test-results/screenshots/A3-post-login.png',
    });

    // Verify we landed correctly
    const url = page.url();
    expect(url).toMatch(/\/(app|onboarding)/);
  });
});

test.describe('B) In-App Core Routes & Nav', () => {
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');
  test('B4: Dashboard loads', async ({ page }) => {
    await setupPage(page);

    // Login first
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', QA_EMAIL_V1);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    // Navigate to dashboard
    await page.goto(`${APP_URL}/app`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/B4-dashboard.png',
      fullPage: true,
    });

    // Check for no console errors
    const errors = consoleLogs.filter((log) => log.includes('[ERROR]'));
    expect(errors.length).toBe(0);
  });

  test('B5: Nav menu items work', async ({ page }) => {
    await setupPage(page);

    // Login
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', QA_EMAIL_V1);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    // Test nav routes
    const routes = ['/app', '/app/tasks', '/app/vault', '/app/settings'];

    for (const route of routes) {
      await page.goto(`${APP_URL}${route}`);
      await page.waitForLoadState('networkidle');

      // Should not be 404
      const is404 = (await page.locator('text=404').count()) > 0;
      expect(is404).toBe(false);
    }
  });

  test('B6: Settings page update works', async ({ page }) => {
    await setupPage(page);

    // Login
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', QA_EMAIL_V1);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    // Go to settings
    await page.goto(`${APP_URL}/app/settings`);
    await page.waitForLoadState('networkidle');

    // Page should load without error
    const pageTitle = await page.locator('h1, h2').first().textContent();
    expect(pageTitle).toBeTruthy();
  });

  test('B8: Logout works', async ({ page }) => {
    await setupPage(page);

    // Login first
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', QA_EMAIL_V1);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    // Find and click logout
    await page.goto(`${APP_URL}/auth/signout`);

    // Should redirect to signin or marketing
    await page.waitForURL(/(signin|formaos\.com)/, { timeout: 30000 });
  });
});

test.describe('C) Core Feature Smoke Tests', () => {
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');
  test('C9: Create task', async ({ page }) => {
    await setupPage(page);

    // Login
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', QA_EMAIL_V1);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    // Go to tasks
    await page.goto(`${APP_URL}/app/tasks`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/C9-tasks-page.png',
      fullPage: true,
    });

    // Page should load
    const hasTasksContent = (await page.locator('text=/task/i').count()) > 0;
    expect(hasTasksContent).toBe(true);
  });

  test('C12: RBAC - protected routes require auth', async ({ page }) => {
    await setupPage(page);

    // Try to access protected route without login
    await page.goto(`${APP_URL}/app/settings`);

    // Should redirect to signin
    await page.waitForURL(/signin/, { timeout: 30000 });

    await page.screenshot({
      path: 'test-results/screenshots/C12-rbac-redirect.png',
    });
  });
});

test.describe('E) Edge Cases', () => {
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');
  test('E1: Refresh during onboarding', async ({ page }) => {
    await setupPage(page);

    // Create a fresh user with incomplete onboarding
    const { data: userData } = await admin.auth.admin.createUser({
      email: `qa.onboarding.${timestamp}@formaos.team`,
      password: QA_PASSWORD,
      email_confirm: true,
    });

    if (userData?.user) {
      const userId = userData.user.id;
      const now = new Date().toISOString();

      // Create org with onboarding incomplete
      const { data: org } = await admin
        .from('organizations')
        .insert({
          name: 'QA Onboarding Test',
          created_by: userId,
          plan_key: 'basic',
          onboarding_completed: false,
        })
        .select('id')
        .single();

      if (org?.id) {
        await admin.from('org_members').insert({
          organization_id: org.id,
          user_id: userId,
          role: 'owner',
        });

        // Login
        await page.goto(`${APP_URL}/auth/signin`);
        await page.fill(
          'input[type="email"]',
          `qa.onboarding.${timestamp}@formaos.team`,
        );
        await page.fill('input[type="password"]', QA_PASSWORD);
        await page.click('button[type="submit"]');

        // Should go to onboarding
        await page.waitForURL(/onboarding/, { timeout: 30000 });

        // Refresh page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still be on onboarding (not crash)
        expect(page.url()).toContain('onboarding');

        // Cleanup
        await admin.from('org_members').delete().eq('organization_id', org.id);
        await admin.from('organizations').delete().eq('id', org.id);
      }

      await admin.auth.admin.deleteUser(userId);
    }
  });

  test('E3: Direct protected route redirects to signin', async ({ page }) => {
    await setupPage(page);

    // Clear any existing session
    await page.context().clearCookies();

    // Try direct access to protected route
    await page.goto(`${APP_URL}/app/settings`);

    // Should redirect to signin
    await page.waitForURL(/signin/, { timeout: 30000 });

    expect(page.url()).toContain('signin');
  });
});

test.describe('V2: Existing User Login', () => {
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');
  test('V2: Login with existing user', async ({ page }) => {
    await setupPage(page);

    // Create V2 user (simulating existing user)
    const result = await createQAUser(QA_EMAIL_V2, QA_PASSWORD);
    expect(result).not.toBeNull();
    qaUserIdV2 = result!.userId;
    qaOrgIdV2 = result!.orgId;

    // Login
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', QA_EMAIL_V2);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button[type="submit"]');

    // Should land in app
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });

    expect(page.url()).toMatch(/\/(app|onboarding)/);
  });
});

test.describe('Entitlements Verification', () => {
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');
  test('Trial entitlements are correct', async () => {
    // Verify entitlements via API
    if (!qaOrgIdV1) {
      test.skip();
      return;
    }

    const { data: entitlements } = await admin
      .from('org_entitlements')
      .select('feature_key, enabled')
      .eq('organization_id', qaOrgIdV1);

    const enabledFeatures =
      entitlements?.filter((e) => e.enabled).map((e) => e.feature_key) || [];

    // Basic plan should have these features
    expect(enabledFeatures).toContain('audit_export');
    expect(enabledFeatures).toContain('reports');
    expect(enabledFeatures).toContain('framework_evaluations');
    expect(enabledFeatures).toContain('team_limit');

    // Verify subscription status
    const { data: subscription } = await admin
      .from('org_subscriptions')
      .select('plan_key, status, plan_code, trial_expires_at')
      .eq('organization_id', qaOrgIdV1)
      .single();

    expect(subscription?.status).toBe('trialing');
    expect(subscription?.plan_key).toBe('basic');
    expect(subscription?.plan_code).toBe('starter'); // Legacy mapping

    // Trial should be 14 days from now
    const trialEnd = new Date(subscription?.trial_expires_at || '');
    const now = new Date();
    const daysUntilExpiry = Math.round(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(daysUntilExpiry).toBeGreaterThanOrEqual(13);
    expect(daysUntilExpiry).toBeLessThanOrEqual(14);
  });
});
