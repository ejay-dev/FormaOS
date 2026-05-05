/**
 * Enterprise Invariants E2E Tests
 * Tests: Critical business logic that must always work
 */

import { test, expect } from '@playwright/test';
import {
  cleanupTestUser,
  isE2EAuthBootstrapError,
} from './helpers/test-auth';
import {
  getCredentials,
  gotoAppRoute,
  loginAs,
  waitForAppReady,
} from './helpers/fixtures';

// =========================================================
// DASHBOARD STABILITY TESTS
// =========================================================
test.describe('Dashboard Stability', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Main dashboard loads without JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await gotoAppRoute(page, '/app');

    // Allow minor errors, but fail on critical ones
    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Script error')
    );

    if (criticalErrors.length > 0) {
      console.error('Critical JS errors:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
    console.log('Dashboard loaded without critical JS errors');
  });

  test('Executive dashboard handles missing data gracefully', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await gotoAppRoute(page, '/app/executive');

    // Should show either dashboard content or access denied (not crash)
    const hasContent = await page
      .locator('body')
      .textContent()
      .then((text) => /executive dashboard|command center|overall score|not authorized/i.test(text ?? ''));

    expect(hasContent).toBe(true);

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Script error')
    );
    expect(criticalErrors.length).toBe(0);
    console.log('Executive dashboard rendered gracefully');
  });

  test('Compliance dashboard handles empty state', async ({ page }) => {
    await gotoAppRoute(page, '/app/compliance');

    // Should show either data or empty state (not error)
    const hasContent = await page
      .locator('text=/compliance|framework|control|no data|get started/i')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasContent).toBe(true);
    console.log('Compliance dashboard handles empty state');
  });
});

// =========================================================
// API RESILIENCE TESTS
// =========================================================
test.describe('API Resilience', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('APIs return valid JSON on success', async ({ page }) => {
    const apis = [
      '/api/v1/controls',
      '/api/customer-health/score',
    ];

    for (const api of apis) {
      const response = await page.request.get(api);

      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');

        // Should be valid JSON
        const data = await response.json();
        expect(data).toBeDefined();
        console.log(`${api}: Valid JSON response`);
      } else {
        console.log(`${api}: Status ${response.status()}`);
      }
    }
  });

  test('APIs handle errors gracefully', async ({ page }) => {
    // Request with invalid params should not crash
    const response = await page.request.get(
      '/api/reports/export?type=invalid-framework&format=json&mode=sync',
    );

    // Should return JSON error, not HTML error page
    const contentType = response.headers()['content-type'] || '';
    if (response.status() >= 400) {
      expect(contentType).toContain('application/json');
    }
    console.log('APIs handle invalid params gracefully');
  });
});

// =========================================================
// SUBSCRIPTION INVARIANTS
// =========================================================
test.describe('Subscription Invariants', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('User always has a valid subscription state', async ({ page }) => {
    const response = await page.request.get('/api/billing/subscription');

    if (response.status() === 200) {
      const data = await response.json();

      // Should have subscription or trial info
      const hasSubscription =
        data.subscription ||
        data.plan ||
        data.status ||
        data.trial;

      expect(hasSubscription).toBeTruthy();
      console.log('User has valid subscription state');
    } else {
      // 403 is acceptable if billing is restricted
      expect([403, 404]).toContain(response.status());
    }
  });

  test('Billing page loads without error', async ({ page }) => {
    await gotoAppRoute(page, '/app/billing');

    // Should show billing info or upgrade prompt
    const hasContent = await page
      .locator('text=/plan|billing|subscription|upgrade|trial/i')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasContent).toBe(true);
    console.log('Billing page loads successfully');
  });
});

// =========================================================
// AUTOMATION RESILIENCE
// =========================================================
test.describe('Automation Resilience', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('Cron endpoint health check responds', async ({ page }) => {
    const response = await page.request.get('/api/automation/cron');

    // Health check should always return 200
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    console.log('Cron health check passed');
  });
});

// =========================================================
// NAVIGATION INVARIANTS
// =========================================================
test.describe('Navigation Invariants', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('All main nav links work', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    const navLinks = [
      { selector: 'a[href="/app"]', name: 'Dashboard' },
      { selector: 'a[href="/app/compliance"]', name: 'Compliance' },
      { selector: 'a[href="/app/vault"]', name: 'Vault' },
    ];

    for (const link of navLinks) {
      const element = page.locator(link.selector).first();
      const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        await element.click();
        await waitForAppReady(page);

        // Should not show error page
        const errorPage = page.locator('text=/error|500|something went wrong/i');
        const hasError = await errorPage.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasError).toBe(false);
        console.log(`${link.name} navigation works`);
      }
    }
  });
});

// =========================================================
// DATA INTEGRITY INVARIANTS
// =========================================================
test.describe('Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const creds = await getCredentials();
      await loginAs(page, creds.email, creds.password);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test('Compliance scores are valid percentages', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    if (response.status() === 200) {
      const data = await response.json();

      if (data.healthScore?.score !== undefined) {
        const score = data.healthScore.score;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        console.log(`Health score: ${score} (valid range)`);
      }
    }
  });

  test('Dates are valid ISO strings', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    // Check audit logs for valid dates
    const response = await page.request.get('/api/audit/logs?limit=5');

    if (response.status() === 200) {
      const data = await response.json();
      const logs = data.logs || data.data || [];

      for (const log of logs.slice(0, 5)) {
        if (log.created_at) {
          const date = new Date(log.created_at);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      }
      console.log('Audit log dates are valid');
    }
  });
});
