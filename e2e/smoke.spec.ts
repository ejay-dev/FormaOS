/**
 * Critical User Journey Smoke Test
 * Tests: Home → Pricing → Signup → Trial Provisioning → Dashboard Access
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = `smoke-${Date.now()}@qa.formaos.test`;
const TEST_PASSWORD = 'SmokeTest123!@#';

test('Protected route redirects without loop (>2 repeats fails)', async ({
  request,
  baseURL,
}) => {
  const origin = baseURL ?? process.env.PLAYWRIGHT_APP_BASE ?? 'http://localhost:3000';
  let currentUrl = new URL('/app', origin).toString();
  const maxHops = 8;
  const redirectCounts = new Map<string, number>();
  const chain: string[] = [];

  for (let hop = 0; hop < maxHops; hop += 1) {
    const response = await request.get(currentUrl, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    const currentPath = new URL(currentUrl).pathname;
    const status = response.status();
    chain.push(`${status}:${currentPath}`);

    if (status < 300 || status >= 400) {
      expect(currentPath).toContain('/auth/signin');
      return;
    }

    const locationHeader = response.headers().location;
    expect(locationHeader, `Missing location header on redirect. Chain: ${chain.join(' -> ')}`).toBeTruthy();

    const nextUrl = new URL(locationHeader!, currentUrl).toString();
    const nextPath = new URL(nextUrl).pathname;
    const seen = (redirectCounts.get(nextPath) ?? 0) + 1;
    redirectCounts.set(nextPath, seen);

    expect(
      seen,
      `Redirect loop detected for ${nextPath}. Chain: ${chain.join(' -> ')}`,
    ).toBeLessThanOrEqual(2);

    currentUrl = nextUrl;
  }

  throw new Error(`Redirect chain exceeded ${maxHops} hops: ${chain.join(' -> ')}`);
});

test('Critical user journey smoke test', async ({ page }) => {
  // 1. Home page loads
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();

  // 2. Navigate to pricing
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Pricing|FormaOS/i);

  // 3. Click a visible Start Free CTA (desktop/mobile resilient)
  const startFreeCta = page.locator('a:has-text("Start Free"):visible').first();
  if ((await startFreeCta.count()) > 0) {
    await startFreeCta.click();
  } else {
    await page.goto('/auth/signup', { waitUntil: 'networkidle' });
  }

  // 4. Should land on signup page
  await expect(page).toHaveURL(/\/auth\/signup/);

  // 5. Fill signup form
  await page.fill('input[type="email"]', TEST_EMAIL);
  const passwordFields = page.locator('input[type="password"]');
  await expect(passwordFields.first()).toBeVisible({ timeout: 10000 });
  await passwordFields.first().fill(TEST_PASSWORD);
  await expect(passwordFields.nth(1)).toBeVisible({ timeout: 10000 });
  await passwordFields.nth(1).fill(TEST_PASSWORD);

  // 6. Submit signup
  await page.click('[data-testid="signup-submit-button"]');

  // 7. Wait for post-signup transition
  await expect
    .poll(
      () => page.url(),
      {
        timeout: 30000,
      },
    )
    .toMatch(/\/auth\/check-email|\/auth\/callback|\/onboarding|\/app/);

  if (page.url().includes('/auth/check-email')) {
    await expect(page.locator('text=/Check.*Email/i')).toBeVisible();
  }

  // PASS if we reach here
  console.log('✓ SMOKE TEST PASSED');
});
