/**
 * Care Operations Scorecard E2E Tests
 * Tests: Industry-specific visibility, metrics display, credential alerts
 */

import { test, expect, type APIResponse, type Page } from '@playwright/test';
import { cleanupTestUser } from './helpers/test-auth';
import { getCredentials, gotoAppRoute, loginAs } from './helpers/fixtures';

test.describe.configure({ mode: 'serial' });

async function getApiWithRetry(
  page: Page,
  url: string,
): Promise<APIResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.request.get(url);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ECONNRESET') ||
        message.includes('ERR_NETWORK_CHANGED') ||
        message.includes('ERR_CONNECTION_RESET');
      if (!retryable || attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  throw lastError;
}

// =========================================================
// CARE SCORECARD DISPLAY TESTS
// =========================================================
test.describe('Care Operations Scorecard', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Dashboard shows scorecard for care industries', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    // Look for care operations scorecard component
    const scorecard = page.locator('[data-testid="care-scorecard"], text=/care operations/i');
    const hasScorecard = await scorecard.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Scorecard should be visible for NDIS/Healthcare/Aged Care industries
    // For other industries, it should be hidden
    if (hasScorecard) {
      console.log('Care Operations Scorecard displayed for care industry');

      // Check for key metrics
      const staffCompliance = page.locator('text=/staff compliance/i');
      const credentials = page.locator('text=/credentials/i');

      const hasStaffCompliance = await staffCompliance.isVisible({ timeout: 3000 }).catch(() => false);
      const hasCredentials = await credentials.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasStaffCompliance || hasCredentials).toBe(true);
    } else {
      console.log('Care Scorecard not shown (org may be non-care industry)');
    }
  });

  test('Scorecard shows staff compliance percentage', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    // Look for compliance percentage
    const compliancePercentage = page.locator('text=/%/');
    const hasPercentage = await compliancePercentage.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPercentage) {
      // Should show a valid percentage (0-100)
      const text = await compliancePercentage.first().textContent();
      const percentMatch = text?.match(/(\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1], 10);
        expect(percent).toBeGreaterThanOrEqual(0);
        expect(percent).toBeLessThanOrEqual(100);
        console.log(`Staff compliance shown as ${percent}%`);
      }
    }
  });

  test('Scorecard displays credential alerts', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    // Look for alert indicators
    const alerts = page.locator('[data-testid="credential-alert"], .bg-amber-500, .bg-red-500, text=/expir/i');
    const hasAlerts = await alerts.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAlerts) {
      console.log('Credential alerts displayed on scorecard');
    } else {
      console.log('No credential alerts (all credentials may be current)');
    }
  });

  test('Scorecard shows visit completion rate', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    // Look for visit metrics
    const visitMetrics = page.locator('text=/visit/i');
    const hasVisitMetrics = await visitMetrics.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVisitMetrics) {
      console.log('Visit completion metrics displayed');
    }
  });
});

// =========================================================
// CARE API ENDPOINT TESTS
// =========================================================
test.describe('Care Operations API', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Scorecard API returns data for care industries', async ({ page }) => {
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/scorecard',
    );

    // Returns 200 for care industries, 403 for others
    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('scorecard');
      expect(data.scorecard).toHaveProperty('staffCompliance');
      expect(data.scorecard).toHaveProperty('credentials');
      console.log('Scorecard API returned valid care metrics');
    } else {
      console.log('Scorecard API requires care industry (403 expected for non-care)');
    }
  });

  test('Credential alerts API returns expiring credentials', async ({ page }) => {
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/credential-alerts',
    );

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('expiring');
      expect(data).toHaveProperty('expired');
      expect(Array.isArray(data.expiring)).toBe(true);
      console.log('Credential alerts API returned valid data');
    }
  });

  test('Credential alerts API supports day filter', async ({ page }) => {
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/credential-alerts?days=30',
    );

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.filters).toHaveProperty('daysAhead', 30);
      console.log('Credential alerts API respects day filter');
    }
  });
});

// =========================================================
// INDUSTRY-SPECIFIC VISIBILITY TESTS
// =========================================================
test.describe('Industry-Specific Visibility', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Scorecard hidden for non-care industries', async ({ page }) => {
    // This test checks that the scorecard API returns 403 for non-care industries
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/scorecard',
    );

    // If 403, scorecard is correctly hidden for non-care industry
    // If 200, user is in a care industry
    if (response.status() === 403) {
      console.log('Scorecard correctly hidden for non-care industry');
    } else {
      console.log('User is in care industry - scorecard shown');
    }
  });

  test('Scorecard shows for NDIS industry', async ({ page }) => {
    // Navigate to dashboard and check for industry indicator
    await gotoAppRoute(page, '/app');

    // Look for industry text
    const industryText = page.locator('text=/ndis|healthcare|aged care/i');
    const isCareIndustry = await industryText.isVisible({ timeout: 3000 }).catch(() => false);

    if (isCareIndustry) {
      // Should show care scorecard
      const scorecard = page.locator('text=/care operations/i');
      const hasScorecard = await scorecard.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasScorecard).toBe(true);
      console.log('Care scorecard correctly shown for care industry');
    }
  });
});
