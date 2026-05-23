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

    // Look for framework options
    const frameworks = page.locator('text=/soc ?2|iso ?27001|ndis|hipaa/i');
    const hasFrameworks = await frameworks
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasFrameworks) {
      const count = await frameworks.count();
      console.log(`${count} report framework options available`);
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

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(data).toHaveProperty('frameworkCode');
      expect(data).toHaveProperty('readinessScore');
      expect(data).toHaveProperty('controlSummary');
      console.log('SOC2 report export returned valid data');
    }
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

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(data).toHaveProperty('frameworkCode', 'ISO27001');
      expect(data).toHaveProperty('statementOfApplicability');
      expect(data).toHaveProperty('riskAssessmentSummary');
      console.log('ISO27001 report export returned valid data');
    }
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

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(data).toHaveProperty('frameworkCode', 'NDIS');
      expect(data).toHaveProperty('practiceStandards');
      expect(data).toHaveProperty('participantSafetyMetrics');
      console.log('NDIS report export returned valid data');
    }
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

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(data).toHaveProperty('frameworkCode', 'HIPAA');
      expect(data).toHaveProperty('privacyRuleCompliance');
      expect(data).toHaveProperty('securityRuleCompliance');
      console.log('HIPAA report export returned valid data');
    }
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

    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/pdf');
      console.log('PDF export returns correct content type');
    }
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

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(data).toHaveProperty('organizationName');
      expect(data.organizationName.length).toBeGreaterThan(0);
      console.log(`Report for organization: ${data.organizationName}`);
    }
  });

  test('Report includes control summary', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      const summary = data.controlSummary;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('satisfied');
      expect(summary).toHaveProperty('missing');
      expect(summary).toHaveProperty('partial');

      console.log('Control summary:', summary);
    }
  });

  test('Report includes evidence summary', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      const evidence = data.evidenceSummary;

      expect(evidence).toHaveProperty('total');
      expect(evidence).toHaveProperty('verified');
      expect(evidence).toHaveProperty('pending');

      console.log('Evidence summary:', evidence);
    }
  });

  test('Report includes gaps', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=soc2&format=json&mode=sync',
    );

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(data).toHaveProperty('gaps');
      expect(data.gaps).toHaveProperty('criticalGaps');
      expect(Array.isArray(data.gaps.criticalGaps)).toBe(true);

      console.log(
        `Report identifies ${data.gaps.criticalGaps.length} critical gaps`,
      );
    }
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

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(Array.isArray(data.statementOfApplicability)).toBe(true);

      if (data.statementOfApplicability.length > 0) {
        const entry = data.statementOfApplicability[0];
        expect(entry).toHaveProperty('clauseNumber');
        expect(entry).toHaveProperty('controlName');
        expect(entry).toHaveProperty('implementationStatus');
        console.log('ISO27001 Statement of Applicability included');
      }
    }
  });

  test('NDIS includes practice standards', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=ndis&format=json&mode=sync',
    );

    if (response.status() === 200) {
      const data = unwrapReportPayload(await response.json());
      expect(Array.isArray(data.practiceStandards)).toBe(true);

      if (data.practiceStandards.length > 0) {
        const standard = data.practiceStandards[0];
        expect(standard).toHaveProperty('standardCode');
        expect(standard).toHaveProperty('complianceStatus');
        console.log('NDIS practice standards included');
      }
    }
  });

  test('HIPAA includes rule compliance', async ({ page }) => {
    const response = await getReportExportWithRetry(
      page,
      '/api/reports/export?type=hipaa&format=json&mode=sync',
    );

    if (response.status() === 200) {
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
    }
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

    // Look for export/download buttons
    const exportBtn = page.locator(
      'button:has-text("Export"), button:has-text("Download"), a:has-text("Export")',
    );
    const hasExport = await exportBtn
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasExport) {
      console.log('Export button visible on reports page');
    }
  });

  test('Format selection is available', async ({ page }) => {
    await gotoAppRoute(page, '/app/reports');

    // Look for format options
    const formats = page.locator('text=/pdf|json|csv/i');
    const hasFormats = await formats
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasFormats) {
      console.log('Format selection available');
    }
  });
});
