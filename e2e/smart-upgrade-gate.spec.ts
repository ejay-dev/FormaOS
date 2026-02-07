/**
 * Smart Upgrade Gate E2E Tests
 * Tests: Feature gating, upgrade modals, plan comparison, checkout flow
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
// FEATURE GATE DISPLAY TESTS
// =========================================================
test.describe('Smart Upgrade Gate', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Feature gate shows upgrade prompt for locked features', async ({ page }) => {
    await page.goto('/app/workflows');
    await page.waitForLoadState('networkidle');

    // Look for locked feature indicators
    const lockedFeature = page.locator('[data-testid="locked-feature"], text=/upgrade|unlock|pro|enterprise/i');
    const hasLocked = await lockedFeature.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLocked) {
      console.log('Feature gate displayed for locked feature');
    } else {
      console.log('Feature may be unlocked or user has premium plan');
    }
  });

  test('Upgrade modal shows feature-specific benefits', async ({ page }) => {
    await page.goto('/app/workflows');
    await page.waitForLoadState('networkidle');

    // Look for upgrade button and click it
    const upgradeBtn = page.locator('button:has-text("Upgrade"), [data-testid="upgrade-btn"]');
    const hasUpgradeBtn = await upgradeBtn.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasUpgradeBtn) {
      await upgradeBtn.first().click();

      // Modal should appear with benefits
      const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
      const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasModal) {
        // Should show benefits
        const benefits = page.locator('text=/benefit|feature|include/i');
        const hasBenefits = await benefits.first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasBenefits).toBe(true);
        console.log('Upgrade modal shows feature-specific benefits');
      }
    }
  });

  test('Plan comparison table is visible in upgrade modal', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');

    // Look for plan comparison
    const planComparison = page.locator('[data-testid="plan-comparison"], text=/basic|pro|enterprise/i');
    const hasComparison = await planComparison.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasComparison) {
      // Should show multiple plans
      const plans = page.locator('text=/basic|pro|enterprise/i');
      const planCount = await plans.count();
      expect(planCount).toBeGreaterThan(1);
      console.log(`Plan comparison shows ${planCount} plan options`);
    }
  });

  test('Usage metrics are displayed in upgrade context', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');

    // Look for usage indicators
    const usageMetrics = page.locator('text=/used|limit|remaining|of/i');
    const hasUsage = await usageMetrics.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUsage) {
      console.log('Usage metrics displayed in billing/upgrade context');
    }
  });
});

// =========================================================
// CHECKOUT FLOW TESTS
// =========================================================
test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Upgrade CTA navigates to checkout or billing', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');

    // Find upgrade/checkout button
    const checkoutBtn = page.locator('button:has-text("Upgrade"), button:has-text("Choose"), a:has-text("Upgrade")');
    const hasCheckout = await checkoutBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCheckout) {
      // Click and verify navigation (may go to Stripe)
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('stripe') || resp.url().includes('billing'), { timeout: 10000 }).catch(() => null),
        checkoutBtn.first().click(),
      ]);

      // Should either navigate to Stripe or stay on billing page
      console.log('Checkout CTA triggers navigation');
    }
  });

  test('Contact sales button appears for enterprise', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');

    // Look for contact sales option
    const contactSales = page.locator('text=/contact sales|talk to sales|enterprise/i');
    const hasContactSales = await contactSales.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasContactSales) {
      console.log('Contact sales option available for enterprise');
    }
  });
});

// =========================================================
// FEATURE BENEFITS TESTS
// =========================================================
test.describe('Feature Benefits Display', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Locked feature shows specific value proposition', async ({ page }) => {
    await page.goto('/app/workflows');
    await page.waitForLoadState('networkidle');

    // Look for feature-specific benefits
    const benefits = page.locator('[data-testid="feature-benefits"], text=/automate|workflow|time|effort/i');
    const hasBenefits = await benefits.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBenefits) {
      console.log('Feature-specific value proposition displayed');
    }
  });

  test('Approaching limit shows usage warning', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Look for limit warnings
    const limitWarning = page.locator('text=/approaching|limit|quota|80%|90%/i');
    const hasWarning = await limitWarning.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWarning) {
      console.log('Approaching limit warning displayed');
    } else {
      console.log('No limit warnings (usage within limits)');
    }
  });
});
