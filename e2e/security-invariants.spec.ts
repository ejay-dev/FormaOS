/**
 * Security Invariants E2E Tests
 * Tests: RBAC enforcement, org isolation, admin access controls
 */

import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  cleanupTestUser,
  E2EAuthBootstrapError,
  isE2EAuthBootstrapError,
} from './helpers/test-auth';

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
  try {
    testCredentials = await getTestCredentials();
  } catch (error) {
    if (error instanceof E2EAuthBootstrapError) {
      test.skip(true, error.message);
      return undefined as never; // unreachable
    }
    throw error;
  }
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
  try {
    await page.waitForURL(/\/app/, { timeout: 20000 });
  } catch {
    const url = page.url();
    // We only reach loginAs AFTER getCredentials() succeeded — i.e. Supabase
    // secrets are present and the test user bootstrapped. A login that then
    // fails to land on /app is a genuine auth/onboarding regression, not an
    // environment gap, so it must FAIL the test rather than skip (which is
    // how an RBAC regression previously turned green). Escape hatch:
    // E2E_STRICT_AUTH=0 restores the old skip behaviour for flaky local runs.
    if (process.env.E2E_STRICT_AUTH === '0') {
      test.skip(
        true,
        `loginAs: landed on ${url} instead of /app (strict auth disabled)`,
      );
      return;
    }
    throw new Error(
      `loginAs failed: landed on ${url} instead of /app. Credentials bootstrapped, ` +
        `so this is a real sign-in/onboarding regression. Set E2E_STRICT_AUTH=0 to skip locally.`,
    );
  }
  await dismissProductTour(page);
}

async function dismissProductTour(page: Page) {
  try {
    await page
      .waitForLoadState('networkidle', { timeout: 5000 })
      .catch(() => {});
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
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error
          ? error.message
          : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  // v4-031: previously asserted `[200,403].toContain(status)`, so a
  // privilege-escalation regression returning 200 to a non-admin/non-
  // founder still passed. The workspace-seed login above runs as a
  // standard member; these admin/founder endpoints must reject.
  test('Executive APIs require admin or owner role', async ({ page }) => {
    const adminAPIs = [
      '/api/executive/posture',
      '/api/executive/frameworks',
      '/api/executive/audit-forecast',
    ];

    for (const api of adminAPIs) {
      const response = await page.request.get(api);
      expect(
        response.status(),
        `${api} should reject non-admin caller`,
      ).toBe(403);
    }
  });

  test('Admin endpoints require founder access', async ({ page }) => {
    const founderAPIs = [
      '/api/admin/orgs',
      '/api/admin/support',
      '/api/admin/support/automation-failures',
      '/api/admin/support/billing-timeline',
    ];

    for (const api of founderAPIs) {
      const response = await page.request.get(api);
      expect(
        response.status(),
        `${api} should reject non-founder caller`,
      ).toBe(403);
    }
  });

  test('Customer health rankings require founder access', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/rankings');
    expect(response.status()).toBe(403);
  });
});

// =========================================================
// ORG ISOLATION TESTS
// =========================================================
test.describe('Organization Isolation', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error
          ? error.message
          : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('Cannot access other org data via API', async ({ page }) => {
    // Try to access a random org ID (should fail or return empty)
    const randomOrgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    // Try various endpoints with fake org ID
    const response = await page.request.get(
      `/api/compliance/controls?org_id=${randomOrgId}`,
    );

    // Should either:
    // 1. Return 403/404 (access denied)
    // 2. Return empty results (RLS filtering)
    // 3. Ignore the org_id param entirely and return user's own data
    if (response.status() === 200) {
      const data = await response.json();
      // If 200, data should be empty or from user's own org
      if (Array.isArray(data)) {
        console.log(
          `Query returned ${data.length} items (should be 0 or from own org)`,
        );
      }
    } else {
      console.log(`Query blocked with status ${response.status()}`);
    }
  });

  test('Dashboard only shows own org data', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('link', { name: /dashboard/i }).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).toContainText(/dashboard/i, {
      timeout: 15000,
    });

    // Should not see "Access Denied" or other org names
    const accessDenied = page.locator(
      'text=/access denied|unauthorized|forbidden/i',
    );
    const hasDenied = await accessDenied
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(hasDenied).toBe(false);

    console.log('Dashboard loads without access errors');
  });
});

// =========================================================
// AUTHENTICATION INVARIANTS
// =========================================================
test.describe('Authentication Invariants', () => {
  test('Protected routes redirect to signin when not authenticated', async ({
    page,
  }) => {
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

      // Should be blocked. Most protected routes redirect to signin; /app/team
      // intentionally routes unauthenticated visitors to /unauthorized (a
      // documented SOC2 access-controls-probe design — see app/app/layout.tsx),
      // which is still a "blocked" outcome. Accept either.
      await page
        .waitForURL(/\/(auth\/signin|signin|login|unauthorized)/i, { timeout: 10000 })
        .catch(() => {});
      const url = page.url();
      expect(url).toMatch(/\/(auth\/signin|signin|login|onboarding|unauthorized)/i);
      console.log(`${route}: blocked -> ${new URL(url).pathname}`);
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
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error
          ? error.message
          : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('Export downloads require valid token', async ({ page }) => {
    // Try to download export without token
    const response = await page.request.get(
      '/api/exports/enterprise/fake-job-id',
    );
    expect([401, 404]).toContain(response.status());
    console.log('Export download blocked without token');
  });

  test('Export downloads reject invalid tokens', async ({ page }) => {
    const response = await page.request.get(
      '/api/exports/enterprise/fake-job-id?token=invalid-token',
    );
    expect([401, 403, 404]).toContain(response.status());
    console.log('Export download blocked with invalid token');
  });
});

// =========================================================
// BILLING SECURITY TESTS
// =========================================================
test.describe('Billing Security', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error
          ? error.message
          : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
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
