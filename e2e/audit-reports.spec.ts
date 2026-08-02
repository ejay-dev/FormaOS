/**
 * Audit Certification Reports E2E Tests
 * Tests: Report generation, PDF export, framework-specific reports
 */

import { test, expect, type APIResponse, type Page } from '@playwright/test';
import { cleanupTestUser } from './helpers/test-auth';
import { getCredentials, gotoAppRoute, loginAs } from './helpers/fixtures';

test.describe.configure({ mode: 'serial' });

function unwrapReportPayload(payload: any) {
  return payload?.report && typeof payload.report === 'object'
    ? payload.report
    : payload;
}

function isTransientRequestError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('ECONNRESET') ||
    message.includes('ERR_CONNECTION_RESET') ||
    message.includes('socket hang up') ||
    message.includes('Timeout') ||
    message.includes('Target page, context or browser has been closed')
  );
}

async function getReportExportWithRetry(
  page: Page,
  url: string,
): Promise<APIResponse> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await page.request.get(url, { timeout: 20_000 });
    } catch (error) {
      lastError = error;
      if (!isTransientRequestError(error) || attempt === 3) {
        break;
      }
      await page.waitForTimeout(500 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? 'Report export request failed'));
}

// =========================================================
// REPORTS PAGE TESTS
// =========================================================
test.describe('Audit Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Reports page loads', async ({ page }) => {
    await gotoAppRoute(page, '/app/reports');

    // Should show reports page content
    const hasContent = await page
      .waitForSelector('text=/reports?|certification|compliance|audit/i', {
        timeout: 10000,
      })
      .catch(() => null);

    expect(hasContent).not.toBeNull();
    console.log('Reports page loaded');
  });

  test('Report type selector shows available frameworks', async ({ page }) => {
    await gotoAppRoute(page, '/app/reports');

    // 2026-08-02: this used to resolve a locator, swallow the failure with
    // `.catch(() => false)` and only console.log — it passed with the whole
    // framework list absent. app/app/reports/page.tsx renders EXPORT_CARDS
    // unconditionally under the "Certification Reports" panel, so every one
    // of the four framework cards must be present.
    await expect(
      page.getByText('Certification Reports', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    for (const framework of ['SOC 2', 'ISO 27001', 'NDIS', 'HIPAA']) {
      await expect(
        page.getByRole('heading', { name: framework, exact: true }).first(),
        `${framework} certification report card should be listed`,
      ).toBeVisible();
    }
  });

  test('Certification reports section shows available reports', async ({
    page,
  }) => {
    await gotoAppRoute(page, '/app/reports');

    // Look for certification report cards
    const reportCards = page.locator(
      '[data-testid="report-card"], .rounded-xl.border',
    );
    const count = await reportCards.count();

    expect(count).toBeGreaterThan(0);
    console.log(`${count} report cards displayed`);
  });
});

// =========================================================
// REPORT EXPORT API TESTS
// =========================================================
test.describe('Report Export API', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('SOC2 report export returns data', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    // v4-031: previously `[200,401,403].toContain` — auth regressions
    // returned 401 and the test silently passed. The workspace-seed
    // login above grants the auth context; 200 is the contract.
    expect(response.status()).toBe(200);

    const data = unwrapReportPayload(await response.json());
    expect(data).toHaveProperty('frameworkCode');
    expect(data).toHaveProperty('readinessScore');
    expect(data).toHaveProperty('controlSummary');
    console.log('SOC2 report export returned valid data');
  });

  test('ISO27001 report export returns data', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=iso27001&format=json&mode=sync',
    );

    // v4-031: previously `[200,401,403].toContain` — auth regressions
    // returned 401 and the test silently passed. The workspace-seed
    // login above grants the auth context; 200 is the contract.
    expect(response.status()).toBe(200);

    const data = unwrapReportPayload(await response.json());
    expect(data).toHaveProperty('frameworkCode', 'ISO27001');
    expect(data).toHaveProperty('statementOfApplicability');
    expect(data).toHaveProperty('riskAssessmentSummary');
    console.log('ISO27001 report export returned valid data');
  });

  test('NDIS report export returns data', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=ndis&format=json&mode=sync',
    );

    // v4-031: previously `[200,401,403].toContain` — auth regressions
    // returned 401 and the test silently passed. The workspace-seed
    // login above grants the auth context; 200 is the contract.
    expect(response.status()).toBe(200);

    const data = unwrapReportPayload(await response.json());
    expect(data).toHaveProperty('frameworkCode', 'NDIS');
    expect(data).toHaveProperty('practiceStandards');
    expect(data).toHaveProperty('participantSafetyMetrics');
    console.log('NDIS report export returned valid data');
  });

  test('HIPAA report export returns data', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=hipaa&format=json&mode=sync',
    );

    // v4-031: previously `[200,401,403].toContain` — auth regressions
    // returned 401 and the test silently passed. The workspace-seed
    // login above grants the auth context; 200 is the contract.
    expect(response.status()).toBe(200);

    const data = unwrapReportPayload(await response.json());
    expect(data).toHaveProperty('frameworkCode', 'HIPAA');
    expect(data).toHaveProperty('privacyRuleCompliance');
    expect(data).toHaveProperty('securityRuleCompliance');
    console.log('HIPAA report export returned valid data');
  });

  test('PDF export triggers download', async ({ page }) => {
    // Note: Playwright can't easily verify PDF download content,
    // but we can verify the response headers
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=pdf&mode=sync',
    );

    // v4-031: previously `[200,401,403].toContain` — auth regressions
    // returned 401 and the test silently passed. The workspace-seed
    // login above grants the auth context; 200 is the contract.
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/pdf');
    console.log('PDF export returns correct content type');
  });
});

// =========================================================
// REPORT CONTENT TESTS
// =========================================================
test.describe('Report Content', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Report includes organization name', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    expect(data).toHaveProperty('organizationName');
    expect(data.organizationName.length).toBeGreaterThan(0);
    console.log(`Report for organization: ${data.organizationName}`);
  });

  test('Report includes control summary', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    const summary = data.controlSummary;

    expect(summary).toHaveProperty('total');
    expect(summary).toHaveProperty('satisfied');
    expect(summary).toHaveProperty('missing');
    expect(summary).toHaveProperty('partial');

    console.log('Control summary:', summary);
  });

  test('Report includes evidence summary', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    const evidence = data.evidenceSummary;

    expect(evidence).toHaveProperty('total');
    expect(evidence).toHaveProperty('verified');
    expect(evidence).toHaveProperty('pending');

    console.log('Evidence summary:', evidence);
  });

  test('Report includes gaps', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    expect(data).toHaveProperty('gaps');
    expect(data.gaps).toHaveProperty('criticalGaps');
    expect(Array.isArray(data.gaps.criticalGaps)).toBe(true);

    console.log(
      `Report identifies ${data.gaps.criticalGaps.length} critical gaps`,
    );
  });
});

// =========================================================
// FRAMEWORK-SPECIFIC TESTS
// =========================================================
test.describe('Framework-Specific Reports', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('ISO27001 includes Statement of Applicability', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=iso27001&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    expect(Array.isArray(data.statementOfApplicability)).toBe(true);

    if (data.statementOfApplicability.length > 0) {
      const entry = data.statementOfApplicability[0];
      expect(entry).toHaveProperty('clauseNumber');
      expect(entry).toHaveProperty('controlName');
      expect(entry).toHaveProperty('implementationStatus');
      console.log('ISO27001 Statement of Applicability included');
    }
  });

  test('NDIS includes practice standards', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=ndis&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    expect(Array.isArray(data.practiceStandards)).toBe(true);

    if (data.practiceStandards.length > 0) {
      const standard = data.practiceStandards[0];
      expect(standard).toHaveProperty('standardCode');
      expect(standard).toHaveProperty('complianceStatus');
      console.log('NDIS practice standards included');
    }
  });

  test('HIPAA includes rule compliance', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=hipaa&format=json&mode=sync',
    );

    const data = unwrapReportPayload(await response.json());
    expect(data.privacyRuleCompliance).toHaveProperty(
      'ruleName',
      'Privacy Rule',
    );
    expect(data.securityRuleCompliance).toHaveProperty(
      'ruleName',
      'Security Rule',
    );
    expect(data.breachNotificationCompliance).toHaveProperty(
      'ruleName',
      'Breach Notification',
    );
    console.log('HIPAA rule compliance included');
  });
});

// =========================================================
// EXPORT UI TESTS
// =========================================================
test.describe('Export UI', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Export button is visible on reports page', async ({ page }) => {
    await gotoAppRoute(page, '/app/reports');

    // 2026-08-02: previously `.catch(() => false)` + console.log with no
    // expect — the test passed with the entire export panel missing. The
    // Buyer Trust Packet block always renders; the generate affordance is
    // either an entitled `report-export-link` or the explicit disabled
    // fallback, and one of the two must exist.
    await expect(
      page.getByRole('heading', { name: 'Buyer Trust Packet' }),
    ).toBeVisible({ timeout: 15_000 });

    const exportLink = page.locator('[data-testid="report-export-link"]').first();
    const exportBlocked = page
      .getByRole('button', { name: 'Generate unavailable' })
      .first();
    await expect(exportLink.or(exportBlocked)).toBeVisible();

    if ((await exportLink.count()) > 0) {
      await expect(exportLink).toHaveAttribute(
        'href',
        '/api/reports/export?type=trust&format=pdf&mode=sync',
      );
    } else {
      await expect(exportBlocked).toBeDisabled();
    }
  });

  test('Export links request an explicit report format', async ({ page }) => {
    await gotoAppRoute(page, '/app/reports');

    // 2026-08-02: this test was named "Format selection is available" and
    // asserted nothing. /app/reports ships no format picker — every export
    // affordance is a direct link to /api/reports/export with the format
    // pinned in the query string (app/app/reports/page.tsx and
    // components/reports/IndustryReportTemplates.tsx). Assert that real
    // contract instead of a selector that never shipped.
    await expect(
      page.getByText('Certification Reports', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    const exportLinks = page.locator('a[href^="/api/reports/export"]');
    const linkCount = await exportLinks.count();

    if (linkCount > 0) {
      const hrefs = await exportLinks.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('href') ?? ''),
      );
      for (const href of hrefs) {
        expect(href).toMatch(
          /^\/api\/reports\/export\?type=(soc2|iso27001|ndis|hipaa|trust)&format=pdf&mode=sync$/,
        );
      }
    } else {
      // Export entitlement absent — the page must say so rather than render
      // a dead panel.
      expect(
        await page
          .getByRole('button', {
            name: /Generate unavailable|Requires admin export access|Requires export access/,
          })
          .count(),
      ).toBeGreaterThan(0);
    }
  });
});
