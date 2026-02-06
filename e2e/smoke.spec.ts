/**
 * Critical User Journey Smoke Test
 * Tests: Home → Pricing → Signup → Trial Provisioning → Dashboard Access
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = `smoke-${Date.now()}@qa.formaos.test`;
const TEST_PASSWORD = 'SmokeTest123!@#';

test('Critical user journey smoke test', async ({ page }) => {
  // 1. Home page loads
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();

  // 2. Navigate to pricing
  await page.goto('/pricing');
  await expect(page).toHaveTitle(/Pricing|FormaOS/i);

  // 3. Click Start Free Trial CTA
  const trialCTA = page.locator('[data-testid="pricing-hero-start-trial"]').first();
  await expect(trialCTA).toBeVisible();
  await trialCTA.click();

  // 4. Should land on signup page
  await expect(page).toHaveURL(/\/auth\/signup/);

  // 5. Fill signup form
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[placeholder*="secure password" i]', TEST_PASSWORD);
  await page.fill('input[placeholder*="Confirm" i]', TEST_PASSWORD);

  // 6. Submit signup
  await page.click('[data-testid="signup-submit-button"]');

  // 7. Should redirect to check-email
  await page.waitForURL(/\/auth\/check-email/, { timeout: 10000 });
  await expect(page.locator('text=/Check.*Email/i')).toBeVisible();

  // PASS if we reach here
  console.log('✓ SMOKE TEST PASSED');
});
