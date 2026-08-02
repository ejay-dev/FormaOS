/**
 * Customer Health Score E2E Tests
 * Tests: Health score display, status calculation, alerts, founder rankings
 */

import { test, expect, type Page } from '@playwright/test';
import { cleanupTestUser } from './helpers/test-auth';
import { getCredentials, loginAs } from './helpers/fixtures';

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

  // 2026-08-02: the three tests below wrapped every assertion in
  // `if (response.status() === 200)` without ever asserting the status. A
  // regression to 401/403/500 on /api/customer-health/score reported green
  // while asserting nothing. `beforeEach` logs in with a seeded workspace
  // user that has an org membership, so 200 is the contract (the route only
  // returns 403 when `org_members` has no row for the user).
  test('Health score includes factors breakdown', async ({ page }) => {
    const response = await getApiWithRetry(page, '/api/customer-health/score');
    expect(response.status()).toBe(200);

    const data = await response.json();
    const factors = data.healthScore.factors;

    expect(factors).toHaveProperty('loginFrequency');
    expect(factors).toHaveProperty('featureAdoption');
    expect(factors).toHaveProperty('complianceTrend');
    expect(factors).toHaveProperty('automationUsage');
    expect(factors).toHaveProperty('overdueCompliance');
  });

  test('Health score includes alerts', async ({ page }) => {
    const response = await getApiWithRetry(page, '/api/customer-health/score');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.healthScore).toHaveProperty('alerts');
    expect(Array.isArray(data.healthScore.alerts)).toBe(true);
  });

  test('Health score includes recommended actions', async ({ page }) => {
    const response = await getApiWithRetry(page, '/api/customer-health/score');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.healthScore).toHaveProperty('recommendedActions');
    expect(Array.isArray(data.healthScore.recommendedActions)).toBe(true);
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
    // 2026-08-02: the threshold check used to be gated on a 200 that was
    // never asserted, so an API failure passed the test with zero coverage
    // of the mapping it is named for.
    expect(response.status()).toBe(200);

    const data = await response.json();
    const score = data.healthScore.score;
    const status = data.healthScore.status;

    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);

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
    // 2026-08-02: previously every assertion was gated on an unasserted 200,
    // so a 401/500 on the founder rankings endpoint passed silently. The
    // route has exactly two legitimate outcomes for an authenticated caller:
    // 403 with FOUNDER_REQUIRED, or 200 with a complete summary.
    const status = response.status();
    expect([200, 403]).toContain(status);

    const data = await response.json();

    if (status === 403) {
      expect(data.code).toBe('FOUNDER_REQUIRED');
      // A denied caller must not receive any cross-tenant ranking payload.
      expect(data).not.toHaveProperty('rankings');
      return;
    }

    const summary = data.rankings.summary;
    expect(summary).toHaveProperty('total');
    expect(summary).toHaveProperty('healthy');
    expect(summary).toHaveProperty('warning');
    expect(summary).toHaveProperty('atRisk');
    expect(summary).toHaveProperty('critical');
    expect(summary).toHaveProperty('averageScore');

    // The buckets are computed from the same list they summarise
    // (lib/customer-health/compute-rankings.ts) — a drift between them is a
    // real defect the shape checks above cannot see.
    expect(summary.total).toBe(data.rankings.organizations.length);
    expect(
      summary.healthy + summary.warning + summary.atRisk + summary.critical,
    ).toBe(summary.total);
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
// 2026-08-02: the "Health Score Display" describe block held two tests
// ("Dashboard may show health indicator", "Health alerts may be shown when
// applicable") that contained no `expect` at all. They were unsalvageable:
// nothing under app/app renders a customer-health indicator or alert — the
// feature has an API (/api/customer-health/score, /api/customer-health/
// rankings) and no in-app surface at all. Rather than invent a selector for
// UI that does not exist, the block was removed; the API contract is covered
// by the tests above. See the report note on the orphaned health-score UI.
