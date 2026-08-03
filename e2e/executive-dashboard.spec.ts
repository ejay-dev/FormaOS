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

  // These three tests previously probed with `isVisible().catch(() => false)`
  // and then only console.log'd inside an `if`, so they passed when the
  // section was missing entirely. Each executive widget has exactly two
  // settled states — populated or explicit-empty — and both carry distinct
  // copy, so asserting "one of the two is visible" fails if the widget stops
  // rendering (empty shell, crash, or removal) while staying data-independent.

  test('Framework rollup displays multiple frameworks', async ({ page }) => {
    await gotoAppRoute(page, '/app/executive');

    // FrameworkRollupWidget: "<n> frameworks tracked" or the empty state.
    const populated = page.getByText(/^\d+ frameworks tracked$/);
    const empty = page.getByText('No compliance frameworks enabled.');
    await expect(populated.or(empty).first()).toBeVisible({ timeout: 20000 });
  });

  test('Critical controls table loads', async ({ page }) => {
    await gotoAppRoute(page, '/app/executive');

    // CriticalControlsTable: "<n> controls require attention" or "No Critical Gaps".
    const populated = page.getByText(/^\d+ controls? require attention$/);
    const empty = page.getByText('No Critical Gaps');
    await expect(populated.or(empty).first()).toBeVisible({ timeout: 20000 });
  });

  test('Deadline calendar shows upcoming deadlines', async ({ page }) => {
    await gotoAppRoute(page, '/app/executive');

    // DeadlineCalendar: "<n> upcoming" or "No Upcoming Deadlines".
    const populated = page.getByText(/^\d+ upcoming$/);
    const empty = page.getByText('No Upcoming Deadlines');
    await expect(populated.or(empty).first()).toBeVisible({ timeout: 20000 });
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
