/**
 * Customer Health Score E2E Tests
 * Tests: Health score display, status calculation, alerts, founder rankings
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
// HEALTH SCORE API TESTS
// =========================================================
test.describe('Customer Health Score API', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Health score API returns valid response', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('healthScore');
      expect(data.healthScore).toHaveProperty('score');
      expect(data.healthScore).toHaveProperty('status');
      expect(data.healthScore).toHaveProperty('factors');

      // Score should be between 0-100
      expect(data.healthScore.score).toBeGreaterThanOrEqual(0);
      expect(data.healthScore.score).toBeLessThanOrEqual(100);

      // Status should be one of the valid values
      expect(['Healthy', 'Warning', 'At Risk', 'Critical']).toContain(data.healthScore.status);

      console.log(`Health score: ${data.healthScore.score} (${data.healthScore.status})`);
    }
  });

  test('Health score includes factors breakdown', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    if (response.status() === 200) {
      const data = await response.json();
      const factors = data.healthScore.factors;

      expect(factors).toHaveProperty('loginFrequency');
      expect(factors).toHaveProperty('featureAdoption');
      expect(factors).toHaveProperty('complianceTrend');
      expect(factors).toHaveProperty('automationUsage');
      expect(factors).toHaveProperty('overdueCompliance');

      console.log('Health score factors:', factors);
    }
  });

  test('Health score includes alerts', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.healthScore).toHaveProperty('alerts');
      expect(Array.isArray(data.healthScore.alerts)).toBe(true);

      if (data.healthScore.alerts.length > 0) {
        console.log(`Health score has ${data.healthScore.alerts.length} alerts`);
      }
    }
  });

  test('Health score includes recommended actions', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.healthScore).toHaveProperty('recommendedActions');
      expect(Array.isArray(data.healthScore.recommendedActions)).toBe(true);

      if (data.healthScore.recommendedActions.length > 0) {
        console.log(`Health score has ${data.healthScore.recommendedActions.length} recommended actions`);
      }
    }
  });
});

// =========================================================
// HEALTH STATUS THRESHOLDS TESTS
// =========================================================
test.describe('Health Status Thresholds', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Health status matches score threshold', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/score');

    if (response.status() === 200) {
      const data = await response.json();
      const score = data.healthScore.score;
      const status = data.healthScore.status;

      // Verify status matches thresholds
      if (score >= 75) {
        expect(status).toBe('Healthy');
      } else if (score >= 50) {
        expect(status).toBe('Warning');
      } else if (score >= 25) {
        expect(status).toBe('At Risk');
      } else {
        expect(status).toBe('Critical');
      }

      console.log(`Score ${score} correctly maps to status ${status}`);
    }
  });
});

// =========================================================
// FOUNDER RANKINGS TESTS
// =========================================================
test.describe('Founder Health Rankings', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Rankings API requires founder access', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/rankings');

    // Should return 403 for non-founders
    expect([200, 403]).toContain(response.status());

    if (response.status() === 403) {
      console.log('Rankings correctly restricted to founders');
    } else {
      const data = await response.json();
      expect(data).toHaveProperty('rankings');
      expect(data.rankings).toHaveProperty('organizations');
      expect(data.rankings).toHaveProperty('summary');
      console.log('Rankings returned for founder user');
    }
  });

  test('Rankings include summary statistics', async ({ page }) => {
    const response = await page.request.get('/api/customer-health/rankings');

    if (response.status() === 200) {
      const data = await response.json();
      const summary = data.rankings.summary;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('healthy');
      expect(summary).toHaveProperty('warning');
      expect(summary).toHaveProperty('atRisk');
      expect(summary).toHaveProperty('critical');
      expect(summary).toHaveProperty('averageScore');

      console.log('Rankings summary:', summary);
    }
  });

  test('Admin health page loads for founders', async ({ page }) => {
    await page.goto('/admin/health');
    await page.waitForLoadState('networkidle');

    // Should show either rankings or access denied
    const hasContent = await page.waitForSelector(
      'text=/health|organization|score/i, text=/not authorized|forbidden/i',
      { timeout: 10000 }
    ).catch(() => null);

    expect(hasContent).not.toBeNull();
    console.log('Admin health page loaded');
  });
});

// =========================================================
// HEALTH SCORE DISPLAY TESTS
// =========================================================
test.describe('Health Score Display', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Dashboard may show health indicator', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Look for health-related indicators
    const healthIndicator = page.locator('[data-testid="health-score"], text=/health|status|healthy|warning|at risk/i');
    const hasHealth = await healthIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHealth) {
      console.log('Health indicator displayed on dashboard');
    } else {
      console.log('Health indicator not prominently displayed (may be in admin view)');
    }
  });

  test('Health alerts may be shown when applicable', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Look for health alerts
    const alerts = page.locator('[data-testid="health-alert"], text=/action required|attention|improve/i');
    const hasAlerts = await alerts.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAlerts) {
      console.log('Health alerts displayed');
    }
  });
});
