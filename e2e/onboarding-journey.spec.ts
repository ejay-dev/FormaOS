// e2e/onboarding-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Onboarding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          user: { id: '123', email: 'test@example.com' },
          access_token: 'mock_token',
        }),
      );
    });

    await page.goto('/onboarding');
  });

  test('Complete onboarding flow without pricing redirect', async ({
    page,
  }) => {
    // Step 1: Welcome
    await expect(page.getByText(/welcome to formaos/i)).toBeVisible();
    await page.getByRole('button', { name: /get started/i }).click();

    // Step 2: Company Information
    await expect(page.getByText(/tell us about your company/i)).toBeVisible();
    await page.fill('input[name="companyName"]', 'Test Company Inc.');
    await page.selectOption('select[name="industry"]', 'technology');
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 3: Team Size
    await expect(page.getByText(/how large is your team/i)).toBeVisible();
    await page.click('label:has-text("1-10 employees")');
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 4: Role & Responsibilities
    await expect(page.getByText(/what's your role/i)).toBeVisible();
    await page.click('label:has-text("Compliance Manager")');
    await page.getByRole('button', { name: /continue/i }).click();

    // Final Step: Complete Setup
    await expect(page.getByText(/you're all set/i)).toBeVisible();
    await page.getByRole('button', { name: /complete setup/i }).click();

    // Should redirect to dashboard, NOT pricing
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/\/pricing/);

    // Verify no pricing-related content appears
    await expect(page.getByText(/upgrade/i)).not.toBeVisible();
    await expect(page.getByText(/subscribe/i)).not.toBeVisible();
    await expect(page.getByText(/payment/i)).not.toBeVisible();
  });

  test('Onboarding progress persistence', async ({ page }) => {
    // Start onboarding
    await page.getByRole('button', { name: /get started/i }).click();
    await page.fill('input[name="companyName"]', 'Test Company');
    await page.getByRole('button', { name: /continue/i }).click();

    // Refresh page
    await page.reload();

    // Should maintain progress
    await expect(page.getByDisplayValue('Test Company')).toBeVisible();
    await expect(page.getByText(/how large is your team/i)).toBeVisible();
  });

  test('Skip onboarding option', async ({ page }) => {
    // Should have skip option
    const skipButton = page.getByRole('button', { name: /skip for now/i });
    await expect(skipButton).toBeVisible();

    await skipButton.click();

    // Should go to dashboard with limited features
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/complete your profile/i)).toBeVisible();
  });

  test('Form validation in onboarding', async ({ page }) => {
    await page.getByRole('button', { name: /get started/i }).click();

    // Try to continue without filling required fields
    await page.getByRole('button', { name: /continue/i }).click();

    // Should show validation errors
    await expect(page.getByText(/company name is required/i)).toBeVisible();
  });

  test('Onboarding accessibility', async ({ page }) => {
    // Check for proper heading structure
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Check for form labels
    const companyInput = page.getByLabelText(/company name/i);
    await expect(companyInput).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: /get started/i }),
    ).toBeFocused();
  });
});
