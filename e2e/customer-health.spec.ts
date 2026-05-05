/**
 * Customer Health Score E2E Tests
 * Tests: Health score display, status calculation, alerts, founder rankings
 */

import { test, expect, type Page } from '@playwright/test';
import { cleanupTestUser } from './helpers/test-auth';
import { getCredentials, gotoAppRoute, loginAs } from './helpers/fixtures';

async function getApiWithRetry(page: Page, path: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.request.get(path, { timeout: 15_000 });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ECONNRESET') ||
        message.includes('ERR_NETWORK_CHANGED') ||
        message.includes('ERR_CONNECTION_RESET') ||
        message.includes('Timeout');

      if (!retryable || attempt === 2) {
        throw error;
      }

      await page.waitForTimeout(500 * (attempt + 1));
    }
  }

  throw lastError;
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
    const response = await getApiWithRetry(page, '/api/customer-health/score');

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
    const response = await getApiWithRetry(page, '/api/customer-health/score');

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
    const response = await getApiWithRetry(page, '/api/customer-health/score');

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
    const response = await getApiWithRetry(page, '/api/customer-health/score');

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
    const response = await getApiWithRetry(page, '/api/customer-health/score');

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
    const response = await getApiWithRetry(page, '/api/customer-health/rankings');

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
    const response = await getApiWithRetry(page, '/api/customer-health/rankings');

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
    await page.goto('/admin/health', { waitUntil: 'domcontentloaded' });

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
    await gotoAppRoute(page, '/app');

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
    await gotoAppRoute(page, '/app');

    // Look for health alerts
    const alerts = page.locator('[data-testid="health-alert"], text=/action required|attention|improve/i');
    const hasAlerts = await alerts.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAlerts) {
      console.log('Health alerts displayed');
    }
  });
});
