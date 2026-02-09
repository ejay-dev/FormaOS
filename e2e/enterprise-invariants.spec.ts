/**
 * Enterprise Invariants E2E Tests
 * Tests: Critical business logic that must always work
 */

import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  cleanupTestUser,
  createMagicLinkSession,
  setPlaywrightSession,
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
  testCredentials = await getTestCredentials();
  return testCredentials;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });

  const appBase = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const session = await createMagicLinkSession(email);
      await setPlaywrightSession(page.context(), session, appBase);
      return;
    } catch (error) {
      console.warn('[E2E] Magic link session failed, falling back to UI login', error);
    }
  }

  await page.goto('/auth/signin');
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
// DASHBOARD STABILITY TESTS
// =========================================================
test.describe('Dashboard Stability', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
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

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

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

    await page.goto('/app/executive');
    await page.waitForLoadState('networkidle');

    // Should show either dashboard content or access denied (not crash)
    const hasContent = await page
      .locator('[data-testid], .text-2xl, text=/score|compliance|framework|not authorized/i')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasContent).toBe(true);

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Script error')
    );
    expect(criticalErrors.length).toBe(0);
    console.log('Executive dashboard rendered gracefully');
  });

  test('Compliance dashboard handles empty state', async ({ page }) => {
    await page.goto('/app/compliance');
    await page.waitForLoadState('networkidle');

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
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('APIs return valid JSON on success', async ({ page }) => {
    const apis = [
      '/api/compliance/controls',
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
    const response = await page.request.get('/api/compliance/controls?invalid_param=true');

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
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
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
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');

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
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
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
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('All main nav links work', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

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
        await page.waitForLoadState('networkidle');

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
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
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
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

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
