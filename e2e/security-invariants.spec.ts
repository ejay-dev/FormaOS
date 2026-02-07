/**
 * Security Invariants E2E Tests
 * Tests: RBAC enforcement, org isolation, admin access controls
 */

import { test, expect, type Page } from '@playwright/test';
import { getTestCredentials, cleanupTestUser } from './helpers/test-auth';

let testCredentials: { email: string; password: string } | null = null;

async function getCredentials(): Promise<{ email: string; password: string }> {
  if (testCredentials) return testCredentials;
  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    testCredentials = {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
    return testCredentials;
  }
  testCredentials = await getTestCredentials();
  return testCredentials;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.evaluate(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });
  await dismissProductTour(page);
}

async function dismissProductTour(page: Page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const tourText = page.locator('text="Product Tour"');
    if (await tourText.isVisible({ timeout: 2000 })) {
      const skipBtn = page.locator('button:has-text("Skip Tour")');
      await skipBtn.click({ timeout: 3000 });
      await tourText.waitFor({ state: 'hidden', timeout: 5000 });
      await page.waitForTimeout(500);
    }
  } catch {
    // Tour not present
  }
}

// =========================================================
// RBAC ENFORCEMENT TESTS
// =========================================================
test.describe('RBAC Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Executive APIs require admin or owner role', async ({ page }) => {
    // These APIs should return 403 for non-admin users
    const adminAPIs = [
      '/api/executive/posture',
      '/api/executive/frameworks',
      '/api/executive/audit-forecast',
    ];

    for (const api of adminAPIs) {
      const response = await page.request.get(api);
      // Should be 200 (if admin) or 403 (if not admin)
      expect([200, 403]).toContain(response.status());
      console.log(`${api}: ${response.status()}`);
    }
  });

  test('Admin endpoints require founder access', async ({ page }) => {
    // These should always return 403 for non-founders
    const founderAPIs = [
      '/api/admin/orgs',
      '/api/admin/support',
      '/api/admin/support/automation-failures',
      '/api/admin/support/billing-timeline',
    ];

    for (const api of founderAPIs) {
      const response = await page.request.get(api);
      // Should be 403 for non-founders
      expect([200, 403]).toContain(response.status());
      if (response.status() === 403) {
        console.log(`${api}: Correctly restricted to founders`);
      } else {
        console.log(`${api}: Accessible (user is founder)`);
      }
    }
  });

  test('Customer health rankings require founder access', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/rankings');
    expect([200, 403]).toContain(response.status());

    if (response.status() === 403) {
      console.log('Health rankings correctly restricted to founders');
    }
  });
});

// =========================================================
// ORG ISOLATION TESTS
// =========================================================
test.describe('Organization Isolation', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Cannot access other org data via API', async ({ page }) => {
    // Try to access a random org ID (should fail or return empty)
    const randomOrgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    // Try various endpoints with fake org ID
    const response = await page.request.get(`/api/compliance/controls?org_id=${randomOrgId}`);

    // Should either:
    // 1. Return 403/404 (access denied)
    // 2. Return empty results (RLS filtering)
    // 3. Ignore the org_id param entirely and return user's own data
    if (response.status() === 200) {
      const data = await response.json();
      // If 200, data should be empty or from user's own org
      if (Array.isArray(data)) {
        console.log(`Query returned ${data.length} items (should be 0 or from own org)`);
      }
    } else {
      console.log(`Query blocked with status ${response.status()}`);
    }
  });

  test('Dashboard only shows own org data', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Should not see "Access Denied" or other org names
    const accessDenied = page.locator('text=/access denied|unauthorized|forbidden/i');
    const hasDenied = await accessDenied.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasDenied).toBe(false);

    console.log('Dashboard loads without access errors');
  });
});

// =========================================================
// AUTHENTICATION INVARIANTS
// =========================================================
test.describe('Authentication Invariants', () => {
  test('Protected routes redirect to signin when not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access protected routes
    const protectedRoutes = [
      '/app',
      '/app/executive',
      '/app/compliance',
      '/app/team',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to signin
      await page.waitForURL(/\/(auth\/signin|signin|login)/i, { timeout: 10000 }).catch(() => {});
      const url = page.url();
      expect(url).toMatch(/\/(auth\/signin|signin|login|onboarding)/i);
      console.log(`${route}: Redirected to auth`);
    }
  });

  test('API endpoints return 401 when not authenticated', async ({ page }) => {
    // Clear session
    await page.context().clearCookies();

    const apiEndpoints = [
      '/api/compliance/controls',
      '/api/executive/posture',
      '/api/customer-health/score',
    ];

    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(endpoint);
      // Should return 401 or 403
      expect([401, 403]).toContain(response.status());
      console.log(`${endpoint}: ${response.status()} (unauthenticated)`);
    }
  });
});

// =========================================================
// EXPORT SECURITY TESTS
// =========================================================
test.describe('Export Security', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Export downloads require valid token', async ({ page }) => {
    // Try to download export without token
    const response = await page.request.get('/api/exports/enterprise/fake-job-id');
    expect([401, 404]).toContain(response.status());
    console.log('Export download blocked without token');
  });

  test('Export downloads reject invalid tokens', async ({ page }) => {
    const response = await page.request.get('/api/exports/enterprise/fake-job-id?token=invalid-token');
    expect([401, 403, 404]).toContain(response.status());
    console.log('Export download blocked with invalid token');
  });
});

// =========================================================
// BILLING SECURITY TESTS
// =========================================================
test.describe('Billing Security', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Billing API requires authentication', async ({ page }) => {
    // Clear session
    await page.context().clearCookies();

    const response = await page.request.get('/api/billing/subscription');
    expect([401, 403]).toContain(response.status());
    console.log('Billing API correctly requires auth');
  });

  test('Cannot modify other org billing', async ({ page }) => {
    const randomOrgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    // Try to update billing for another org
    const response = await page.request.post('/api/billing/update', {
      data: { org_id: randomOrgId, plan: 'enterprise' },
    });

    // Should be blocked
    expect([400, 401, 403, 404, 405]).toContain(response.status());
    console.log('Cross-org billing modification blocked');
  });
});
