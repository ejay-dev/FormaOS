// e2e/auth-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Google OAuth authentication flow', async ({ page }) => {
    // Navigate to sign in
    await page.getByRole('link', { name: /sign in/i }).click();

    // Click Google OAuth button
    const googleButton = page.getByRole('button', {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();

    // Mock Google OAuth response to avoid external dependency
    await page.route('**/auth/v1/authorize**', (route) => {
      route.fulfill({
        status: 302,
        headers: {
          Location: '/auth/callback?code=mock_auth_code',
        },
      });
    });

    await googleButton.click();

    // Should redirect to callback, then dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Email/password sign in flow', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();

    // Fill in email and password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard on successful auth
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Sign up flow with email verification', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();

    // Fill in registration form
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');

    // Accept terms
    await page.check('input[type="checkbox"]');

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show verification message
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('Protected route access without authentication', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard');

    // Should redirect to sign in
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByText(/please sign in/i)).toBeVisible();
  });

  test('Authentication error handling', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();

    // Try with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  });
});
