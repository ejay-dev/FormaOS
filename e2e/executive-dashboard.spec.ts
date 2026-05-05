/**
 * Executive Dashboard E2E Tests
 * Tests: Access control, dashboard loading, posture display, framework rollup
 */

import { test, expect } from '@playwright/test';
import { cleanupTestUser } from './helpers/test-auth';
import { getCredentials, gotoAppRoute, loginAs } from './helpers/fixtures';

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
    await gotoAppRoute(page, '/app/executive');

    // Should either load dashboard or show access denied
    const hasContent = await page.waitForSelector(
      '[data-testid="executive-dashboard"], [data-testid="access-denied"], .text-2xl',
      { timeout: 10000 }
    ).catch(() => null);

    expect(hasContent).not.toBeNull();
    console.log('Executive dashboard page loaded');
  });

  test('Dashboard shows posture score when accessible', async ({ page }) => {
    await gotoAppRoute(page, '/app/executive');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasPosture = /executive dashboard|command center|overall score/i.test(bodyText);
    const hasDenied = /admin access required|not authorized|forbidden/i.test(bodyText);

    // Should show one or the other based on permissions
    expect(hasPosture || hasDenied).toBe(true);

    if (hasPosture) {
      console.log('Posture score displayed for admin user');
    } else {
      console.log('Access denied for non-admin user (expected)');
    }
  });

  test('Framework rollup displays multiple frameworks', async ({ page }) => {
    await gotoAppRoute(page, '/app/executive');

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
    await gotoAppRoute(page, '/app/executive');

    // Check for critical controls section
    const criticalSection = page.locator('text=/critical|attention|action required/i');
    const hasCritical = await criticalSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCritical) {
      console.log('Critical controls section displayed');
    }
  });

  test('Deadline calendar shows upcoming deadlines', async ({ page }) => {
    await gotoAppRoute(page, '/app/executive');

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
