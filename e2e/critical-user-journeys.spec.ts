// e2e/critical-user-journeys.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CRITICAL: User Journey Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('CRITICAL: New user signup → onboarding → dashboard (NO PRICING REDIRECT)', async ({
    page,
  }) => {
    console.log(
      '🔍 Testing critical user journey: NO PRICING REDIRECT during onboarding',
    );

    // Step 1: Navigate to signup
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);

    // Step 2: Fill signup form (mock successful signup)
    await page.fill('input[type="email"]', 'test-user-qa@example.com');
    await page.fill('input[type="password"]', 'testpassword123');

    // Mock the signup success and redirect
    await page.route('**/auth/v1/signup', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test-user-qa@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.getByRole('button', { name: /sign up/i }).click();

    // Step 3: Should be redirected to onboarding (NOT pricing)
    await expect(page).toHaveURL(/\/onboarding/);
    console.log('✅ VERIFIED: User redirected to onboarding, not pricing');

    // Step 4: Complete onboarding flow
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await page.getByRole('button', { name: /get started/i }).click();

    // Company info step
    await page.fill('input[name="companyName"]', 'QA Test Company');
    await page.getByRole('button', { name: /continue/i }).click();

    // Team size step
    await page.click('label:has-text("1-10")');
    await page.getByRole('button', { name: /continue/i }).click();

    // Final step
    await page.getByRole('button', { name: /complete/i }).click();

    // Step 5: CRITICAL VERIFICATION - Should go to dashboard, NOT pricing
    await expect(page).toHaveURL(/\/app/);
    console.log('✅ VERIFIED: Onboarding completed, redirected to dashboard');

    // Ensure we NEVER see pricing content
    await expect(page.getByText(/upgrade/i)).not.toBeVisible();
    await expect(page.getByText(/subscribe/i)).not.toBeVisible();
    await expect(page.getByText(/payment/i)).not.toBeVisible();

    console.log('✅ CRITICAL TEST PASSED: NO PRICING REDIRECTS CONFIRMED');
  });

  test('CRITICAL: Founder access → admin console (not user dashboard)', async ({
    page,
  }) => {
    console.log('🔍 Testing founder access isolation');

    // Mock founder email login
    await page.goto('/auth/signin');

    // Mock successful founder authentication
    await page.route('**/auth/v1/token**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'founder-id',
            email: 'ejazhussaini313@gmail.com', // Founder email
          },
          access_token: 'mock-token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'ejazhussaini313@gmail.com');
    await page.fill('input[type="password"]', 'founderpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to admin console, not user dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Verify admin-specific content is visible
    await expect(page.getByText(/admin/i)).toBeVisible();
    await expect(page.getByText(/users/i)).toBeVisible();

    console.log('✅ VERIFIED: Founder redirected to admin console');
  });

  test('CRITICAL: Non-founder cannot access admin routes', async ({ page }) => {
    console.log('🔍 Testing admin route protection');

    // Try to access admin directly without founder credentials
    await page.goto('/admin');

    // Should be redirected to signin or unauthorized
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);

    // Should see access denied or login prompt
    const isSignInPage = await page.locator('text=/sign in/i').isVisible();
    const isUnauthorizedPage = await page
      .locator('text=/unauthorized/i')
      .isVisible();

    expect(isSignInPage || isUnauthorizedPage).toBeTruthy();

    console.log('✅ VERIFIED: Admin routes properly protected');
  });

  test('CRITICAL: Existing user login resumes properly', async ({ page }) => {
    console.log('🔍 Testing returning user flow');

    await page.goto('/auth/signin');

    // Mock existing user login
    await page.route('**/auth/v1/token**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'existing-user-id',
            email: 'existing@example.com',
            user_metadata: { onboarding_completed: true },
          },
          access_token: 'mock-token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should go directly to dashboard (not onboarding or pricing)
    await expect(page).toHaveURL(/\/app/);

    // Should not see onboarding content
    await expect(page.getByText(/welcome to/i)).not.toBeVisible();

    console.log('✅ VERIFIED: Existing user resumes at dashboard');
  });
});

test.describe('CRITICAL: Performance Validation', () => {
  test('Page load performance meets requirements', async ({ page }) => {
    console.log('🔍 Testing page load performance');

    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);

    // Check for key performance indicators
    await expect(page.getByRole('main')).toBeVisible({ timeout: 1000 });

    console.log(`✅ VERIFIED: Homepage loaded in ${loadTime}ms`);
  });
});
