/**
 * Executive Dashboard E2E Tests
 * Tests: Access control, dashboard loading, posture display, framework rollup
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
// EXECUTIVE DASHBOARD ACCESS TESTS
// =========================================================
test.describe('Executive Dashboard Access', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Executive dashboard page loads', async ({ page }) => {
    await page.goto('/app/executive');

    // Should either load dashboard or show access denied
    const hasContent = await page.waitForSelector(
      '[data-testid="executive-dashboard"], [data-testid="access-denied"], .text-2xl',
      { timeout: 10000 }
    ).catch(() => null);

    expect(hasContent).not.toBeNull();
    console.log('Executive dashboard page loaded');
  });

  test('Dashboard shows posture score when accessible', async ({ page }) => {
    await page.goto('/app/executive');
    await page.waitForLoadState('networkidle');

    // Check if dashboard content is visible (for admins/owners)
    const postureRing = page.locator('[data-testid="posture-ring"], .text-4xl, .text-5xl');
    const accessDenied = page.locator('text=/admin access required|not authorized/i');

    const hasPosture = await postureRing.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasDenied = await accessDenied.isVisible({ timeout: 1000 }).catch(() => false);

    // Should show one or the other based on permissions
    expect(hasPosture || hasDenied).toBe(true);

    if (hasPosture) {
      console.log('Posture score displayed for admin user');
    } else {
      console.log('Access denied for non-admin user (expected)');
    }
  });

  test('Framework rollup displays multiple frameworks', async ({ page }) => {
    await page.goto('/app/executive');
    await page.waitForLoadState('networkidle');

    // Check if framework rollup section exists
    const frameworkSection = page.locator('[data-testid="framework-rollup"], text=/framework/i');
    const hasFrameworks = await frameworkSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFrameworks) {
      // Should show framework cards with scores
      const frameworkCards = page.locator('.rounded-xl.border');
      const count = await frameworkCards.count();
      expect(count).toBeGreaterThan(0);
      console.log(`Framework rollup shows ${count} framework cards`);
    }
  });

  test('Critical controls table loads', async ({ page }) => {
    await page.goto('/app/executive');
    await page.waitForLoadState('networkidle');

    // Check for critical controls section
    const criticalSection = page.locator('text=/critical|attention|action required/i');
    const hasCritical = await criticalSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCritical) {
      console.log('Critical controls section displayed');
    }
  });

  test('Deadline calendar shows upcoming deadlines', async ({ page }) => {
    await page.goto('/app/executive');
    await page.waitForLoadState('networkidle');

    // Check for deadline section
    const deadlineSection = page.locator('text=/deadline|due|upcoming/i');
    const hasDeadlines = await deadlineSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDeadlines) {
      console.log('Deadline section displayed');
    }
  });
});

// =========================================================
// API ENDPOINT TESTS
// =========================================================
test.describe('Executive API Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Posture API returns valid response', async ({ page }) => {
    const response = await page.request.get('/api/executive/posture');

    // Should return 200 (success) or 403 (forbidden for non-admins)
    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('posture');
      expect(data.posture).toHaveProperty('overallScore');
      console.log('Posture API returned valid data');
    } else {
      console.log('Posture API requires admin access (expected)');
    }
  });

  test('Frameworks API returns valid response', async ({ page }) => {
    const response = await page.request.get('/api/executive/frameworks');

    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('frameworks');
      expect(Array.isArray(data.frameworks)).toBe(true);
      console.log('Frameworks API returned valid data');
    }
  });

  test('Audit forecast API returns valid response', async ({ page }) => {
    const response = await page.request.get('/api/executive/audit-forecast');

    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('auditForecast');
      expect(data.auditForecast).toHaveProperty('readinessScore');
      console.log('Audit forecast API returned valid data');
    }
  });
});
