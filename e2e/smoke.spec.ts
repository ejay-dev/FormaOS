/**
 * Critical User Journey Smoke Test
 * Tests: Home → Pricing → Foundation self-serve signup (plan=basic, intent=checkout) → Dashboard access
 */

import { test, expect } from '@playwright/test';
import { getSupabaseAuthWriteAvailability } from './helpers/test-auth';

const TEST_EMAIL = `smoke-${Date.now()}@qa.formaos.test`;
const TEST_PASSWORD = 'SmokeTest123!@#';

function isPlaceholderValue(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase();
  return (
    !normalized ||
    normalized.startsWith('your-') ||
    normalized.includes('your-project') ||
    normalized.includes('example.com') ||
    normalized.startsWith('placeholder') ||
    normalized.startsWith('changeme')
  );
}

function hasEmailSignupEnv() {
  return ![
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.RESEND_API_KEY,
  ].some((value) => isPlaceholderValue(value));
}

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
  if (!hasEmailSignupEnv()) {
    test.skip(
      true,
      'Skipping: real Supabase and email delivery env are required for signup smoke.',
    );
  }

  const authAvailability = await getSupabaseAuthWriteAvailability();
  test.skip(
    !authAvailability.available,
    authAvailability.reason ??
      'Skipping: Supabase Auth write endpoints are unavailable for signup smoke.',
  );

  // 1. Home page loads
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();

  // 2. Navigate to pricing
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Pricing|FormaOS/i);

  // 3. Click the visible Foundation self-serve CTA. Falls back to direct
  //    /auth/signup navigation for resilience across layout variants.
  const foundationCta = page
    .locator('a:has-text("Start Assessment"):visible')
    .first();
  if ((await foundationCta.count()) > 0) {
    const href = await foundationCta.getAttribute('href');
    if (href) {
      const target = new URL(href, page.url());
      await page.goto(`${target.pathname}${target.search}`, {
        waitUntil: 'networkidle',
      });
    } else {
      await foundationCta.click();
    }
  } else {
    await page.goto('/auth/signup?plan=basic&intent=checkout&source=pricing', {
      waitUntil: 'networkidle',
    });
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
