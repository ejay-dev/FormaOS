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

  // 2026-08-02: "Scorecard displays credential alerts" and "Scorecard shows
  // visit completion rate" used to probe /app for a scorecard widget,
  // console.log both branches and assert nothing. They could not be repaired
  // as dashboard tests: components/dashboard/CareOperationsScorecard.tsx is
  // orphaned — no page imports it, so /app renders no scorecard at all (see
  // the report note). The behaviour these tests were named for lives in
  // /api/care-operations/scorecard, so they now assert the alert composition
  // and the visit-completion arithmetic that endpoint actually performs.
  test('Scorecard displays credential alerts', async ({ page }) => {
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/scorecard',
    );
    const status = response.status();
    expect([200, 403]).toContain(status);

    const body = await response.json();
    if (status === 403) {
      expect(['INDUSTRY_NOT_SUPPORTED', 'INDUSTRY_NOT_SET']).toContain(
        body.code,
      );
      return;
    }

    expect(Array.isArray(body.alerts)).toBe(true);
    for (const alert of body.alerts) {
      expect(['critical', 'warning', 'info']).toContain(alert.type);
      expect(typeof alert.category).toBe('string');
      expect(typeof alert.message).toBe('string');
      expect(alert.message.length).toBeGreaterThan(0);
    }

    // The route sorts critical → warning → info before responding.
    const priority: Record<string, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    const order = body.alerts.map(
      (alert: { type: string }) => priority[alert.type],
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));

    // Every overdue-follow-up incident must raise a critical alert.
    if (body.scorecard.incidents.overdueFollowUp > 0) {
      expect(
        body.alerts.some(
          (alert: { category: string; type: string }) =>
            alert.category === 'incidents' && alert.type === 'critical',
        ),
      ).toBe(true);
    }
  });

  test('Scorecard shows visit completion rate', async ({ page }) => {
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/scorecard',
    );
    const status = response.status();
    expect([200, 403]).toContain(status);

    const body = await response.json();
    if (status === 403) {
      expect(['INDUSTRY_NOT_SUPPORTED', 'INDUSTRY_NOT_SET']).toContain(
        body.code,
      );
      return;
    }

    const visits = body.scorecard.visits;
    expect(typeof visits.completionRate).toBe('number');
    expect(visits.completionRate).toBeGreaterThanOrEqual(0);
    expect(visits.completionRate).toBeLessThanOrEqual(100);

    // lib/care-scorecard/scorecard-service.ts:
    // completionRate = round(completed / (scheduled + completed + missed +
    // cancelled + inProgress) * 100), 0 when the denominator is 0.
    const total =
      visits.scheduled +
      visits.completed +
      visits.missed +
      visits.cancelled +
      visits.inProgress;
    const expected =
      total > 0 ? Math.round((visits.completed / total) * 100) : 0;
    expect(visits.completionRate).toBe(expected);
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
    // 2026-08-02: this was nominally the authorization test for the care
    // scorecard, but it asserted nothing about the status code — it only
    // console.logged both branches, so a scorecard leak to a non-care org
    // would not have been caught.
    const response = await getApiWithRetry(
      page,
      '/api/care-operations/scorecard',
    );
    const status = response.status();
    expect(
      [200, 403],
      `Authenticated scorecard request returned ${status}`,
    ).toContain(status);

    const body = await response.json();

    if (status === 403) {
      // Blocked: the only legitimate reasons are the industry guard, and no
      // scorecard payload may accompany the denial.
      expect(['INDUSTRY_NOT_SUPPORTED', 'INDUSTRY_NOT_SET']).toContain(
        body.code,
      );
      expect(body).not.toHaveProperty('scorecard');
      expect(body).not.toHaveProperty('alerts');
      return;
    }

    // Allowed: the org's industry must be on the route's allow list
    // (CARE_INDUSTRIES in app/api/care-operations/scorecard/route.ts).
    expect(['ndis', 'healthcare', 'aged_care', 'childcare']).toContain(
      body.scorecard.industry,
    );
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
