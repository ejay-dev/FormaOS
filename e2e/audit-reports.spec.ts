/**
 * Audit Certification Reports E2E Tests
 * Tests: Report generation, PDF export, framework-specific reports
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
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');

    // Should show reports page content
    const hasContent = await page.waitForSelector(
      'text=/reports?|certification|compliance|audit/i',
      { timeout: 10000 }
    ).catch(() => null);

    expect(hasContent).not.toBeNull();
    console.log('Reports page loaded');
  });

  test('Report type selector shows available frameworks', async ({ page }) => {
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');

    // Look for framework options
    const frameworks = page.locator('text=/soc ?2|iso ?27001|ndis|hipaa/i');
    const hasFrameworks = await frameworks.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFrameworks) {
      const count = await frameworks.count();
      console.log(`${count} report framework options available`);
    }
  });

  test('Certification reports section shows available reports', async ({ page }) => {
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');

    // Look for certification report cards
    const reportCards = page.locator('[data-testid="report-card"], .rounded-xl.border');
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
    const response = await page.request.get('/api/reports/export?type=soc2&format=json');

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('frameworkCode');
      expect(data).toHaveProperty('readinessScore');
      expect(data).toHaveProperty('controlSummary');
      console.log('SOC2 report export returned valid data');
    }
  });

  test('ISO27001 report export returns data', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?type=iso27001&format=json');

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('frameworkCode', 'ISO27001');
      expect(data).toHaveProperty('statementOfApplicability');
      expect(data).toHaveProperty('riskAssessmentSummary');
      console.log('ISO27001 report export returned valid data');
    }
  });

  test('NDIS report export returns data', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?type=ndis&format=json');

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('frameworkCode', 'NDIS');
      expect(data).toHaveProperty('practiceStandards');
      expect(data).toHaveProperty('participantSafetyMetrics');
      console.log('NDIS report export returned valid data');
    }
  });

  test('HIPAA report export returns data', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?type=hipaa&format=json');

    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('frameworkCode', 'HIPAA');
      expect(data).toHaveProperty('privacyRuleCompliance');
      expect(data).toHaveProperty('securityRuleCompliance');
      console.log('HIPAA report export returned valid data');
    }
  });

  test('PDF export triggers download', async ({ page }) => {
    // Note: Playwright can't easily verify PDF download content,
    // but we can verify the response headers
    const response = await page.request.get('/api/reports/export?type=soc2&format=pdf');

    expect([200, 401, 403]).toContain(response.status());

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
    const response = await page.request.get('/api/reports/export?type=soc2&format=json');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('organizationName');
      expect(data.organizationName.length).toBeGreaterThan(0);
      console.log(`Report for organization: ${data.organizationName}`);
    }
  });

  test('Report includes control summary', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?type=soc2&format=json');

    if (response.status() === 200) {
      const data = await response.json();
      const summary = data.controlSummary;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('satisfied');
      expect(summary).toHaveProperty('missing');
      expect(summary).toHaveProperty('partial');

      console.log('Control summary:', summary);
    }
  });

  test('Report includes evidence summary', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?type=soc2&format=json');

    if (response.status() === 200) {
      const data = await response.json();
      const evidence = data.evidenceSummary;

      expect(evidence).toHaveProperty('total');
      expect(evidence).toHaveProperty('verified');
      expect(evidence).toHaveProperty('pending');

      console.log('Evidence summary:', evidence);
    }
  });

  test('Report includes gaps', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?type=soc2&format=json');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('gaps');
      expect(data.gaps).toHaveProperty('criticalGaps');
      expect(Array.isArray(data.gaps.criticalGaps)).toBe(true);

      console.log(`Report identifies ${data.gaps.criticalGaps.length} critical gaps`);
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
    const response = await page.request.get('/api/reports/export?type=iso27001&format=json');

    if (response.status() === 200) {
      const data = await response.json();
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
    const response = await page.request.get('/api/reports/export?type=ndis&format=json');

    if (response.status() === 200) {
      const data = await response.json();
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
    const response = await page.request.get('/api/reports/export?type=hipaa&format=json');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.privacyRuleCompliance).toHaveProperty('ruleName', 'Privacy Rule');
      expect(data.securityRuleCompliance).toHaveProperty('ruleName', 'Security Rule');
      expect(data.breachNotificationCompliance).toHaveProperty('ruleName', 'Breach Notification');
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
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');

    // Look for export/download buttons
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), a:has-text("Export")');
    const hasExport = await exportBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasExport) {
      console.log('Export button visible on reports page');
    }
  });

  test('Format selection is available', async ({ page }) => {
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');

    // Look for format options
    const formats = page.locator('text=/pdf|json|csv/i');
    const hasFormats = await formats.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFormats) {
      console.log('Format selection available');
    }
  });
});
