/**
 * Enterprise QA Smoke Tests
 * Quick verification of critical enterprise systems
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

test.describe('Enterprise QA Smoke Suite', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  // =========================================================
  // CRITICAL PATH: AUTHENTICATION
  // =========================================================
  test('Authentication flow works', async ({ page }) => {
    // Should be logged in after beforeEach
    const url = page.url();
    expect(url).toContain('/app');
    console.log('PASS: Authentication flow works');
  });

  // =========================================================
  // CRITICAL PATH: DASHBOARD LOADS
  // =========================================================
  test('Dashboard loads without critical errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      // Ignore minor errors
      if (!error.message.includes('ResizeObserver')) {
        jsErrors.push(error.message);
      }
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    expect(jsErrors.length).toBe(0);
    console.log('PASS: Dashboard loads without errors');
  });

  // =========================================================
  // CRITICAL PATH: COMPLIANCE API
  // =========================================================
  test('Compliance APIs respond correctly', async ({ page }) => {
    const response = await page.request.get('/api/compliance/controls');

    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
    console.log('PASS: Compliance APIs respond');
  });

  // =========================================================
  // CRITICAL PATH: HEALTH SCORE
  // =========================================================
  test('Health score API returns valid data', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.healthScore).toBeDefined();
      expect(data.healthScore.score).toBeGreaterThanOrEqual(0);
      expect(data.healthScore.score).toBeLessThanOrEqual(100);
    }
    console.log('PASS: Health score API valid');
  });

  // =========================================================
  // CRITICAL PATH: EXECUTIVE DASHBOARD
  // =========================================================
  test('Executive dashboard stability', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      if (!error.message.includes('ResizeObserver')) {
        jsErrors.push(error.message);
      }
    });

    await page.goto('/app/executive');
    await page.waitForLoadState('networkidle');

    // Should render something (content or access denied)
    const hasContent = await page
      .locator('body')
      .textContent()
      .then((text) => (text?.length || 0) > 100);

    expect(hasContent).toBe(true);
    expect(jsErrors.length).toBe(0);
    console.log('PASS: Executive dashboard stable');
  });

  // =========================================================
  // CRITICAL PATH: BILLING
  // =========================================================
  test('Billing page accessible', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');

    // Should show billing or upgrade content
    const hasContent = await page
      .locator('text=/plan|billing|upgrade|subscription/i')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasContent).toBe(true);
    console.log('PASS: Billing page accessible');
  });

  // =========================================================
  // CRITICAL PATH: CRON HEALTH
  // =========================================================
  test('Automation cron health check', async ({ page }) => {
    const response = await page.request.get('/api/automation/cron');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    console.log('PASS: Cron health check');
  });

  // =========================================================
  // CRITICAL PATH: CARE SCORECARD (if applicable)
  // =========================================================
  test('Care scorecard API responds', async ({ page }) => {
    const response = await page.request.get('/api/care-operations/scorecard');

    // Should return 200 for care industries or 403 for others
    expect([200, 403]).toContain(response.status());
    console.log('PASS: Care scorecard API responds');
  });

  // =========================================================
  // CRITICAL PATH: EXPORT SYSTEM
  // =========================================================
  test('Export endpoint security', async ({ page }) => {
    // Should block unauthenticated/invalid requests
    const response = await page.request.get('/api/exports/enterprise/test-job');

    expect([401, 403, 404]).toContain(response.status());
    console.log('PASS: Export security enforced');
  });

  // =========================================================
  // CRITICAL PATH: NAVIGATION
  // =========================================================
  test('Core navigation works', async ({ page }) => {
    const routes = [
      { path: '/app', name: 'Dashboard' },
      { path: '/app/compliance', name: 'Compliance' },
      { path: '/app/vault', name: 'Vault' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Should not show error page
      const hasError = await page
        .locator('text=/500|error|something went wrong/i')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasError).toBe(false);
    }
    console.log('PASS: Core navigation works');
  });

  // =========================================================
  // CRITICAL PATH: DATA RENDERING
  // =========================================================
  test('No NaN or undefined values in UI', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Check for rendering issues
    const pageText = await page.locator('body').textContent();

    // Should not have unhandled data issues
    expect(pageText).not.toContain('NaN%');
    expect(pageText).not.toContain('undefined%');
    expect(pageText).not.toContain('[object Object]');
    console.log('PASS: No data rendering issues');
  });
});
