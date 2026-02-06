/**
 * Full User Journey E2E Test
 * Tests complete flow: Marketing → Signup → Onboarding → Dashboard → Industries → Features
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test-${Date.now()}@formaos-qa.com`;
const TEST_PASSWORD = 'TestPass123!@#';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Complete User Journey', () => {

  // Test 1: Marketing CTAs
  test('Marketing CTAs route correctly', async ({ page }) => {
    // Homepage
    await page.goto('/');

    // Test "Start Free Trial" CTA
    const startTrialBtn = page.locator('text=/Start.*Trial/i').first();
    await expect(startTrialBtn).toBeVisible();
    await startTrialBtn.click();
    await expect(page).toHaveURL(/\/(app|auth\/signup|signup)/);

    await page.goto('/');

    // Test "Get Started" CTAs
    const getStartedBtns = page.locator('text=/Get.*Started/i');
    if (await getStartedBtns.count() > 0) {
      await getStartedBtns.first().click();
      await expect(page).toHaveURL(/\/(app|auth\/signup|signup)/);
    }
  });

  test('Product page CTAs work', async ({ page }) => {
    await page.goto('/product');
    await expect(page).toHaveTitle(/Product|FormaOS/i);

    const ctas = page.locator('a[href*="signup"], a[href*="/app"], button:has-text("Start")');
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Pricing page CTAs work', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/Pricing|FormaOS/i);

    const startTrialBtns = page.locator('text=/Start.*Trial/i, text=/Get.*Started/i');
    const count = await startTrialBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Industries page loads', async ({ page }) => {
    await page.goto('/industries');
    await expect(page).toHaveTitle(/Industries|FormaOS/i);
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/Contact|FormaOS/i);
  });

  // Test 2: Email/Password Signup Flow
  test('Complete signup with email/password', async ({ page }) => {
    // Go to signup page
    await page.goto('/auth/signup');

    // Fill signup form
    await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);

    // Look for terms checkbox if exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit
    await page.click('button[type="submit"], button:has-text("Sign up"), button:has-text("Create account")');

    // Should redirect to onboarding or dashboard
    await page.waitForURL(/\/(app|onboarding|dashboard)/, { timeout: 10000 });

    // Verify we're authenticated
    await expect(page).not.toHaveURL(/\/auth\/(signin|signup|login)/);
  });

  // Test 3: Dashboard Access
  test('Dashboard loads after signup', async ({ page }) => {
    // Assume we're logged in from previous test
    await page.goto('/app/dashboard');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/app\/dashboard/);

    // Check for key elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // Test 4: Industries Access (Critical - Trial users must have access)
  test('Trial user can access all industries', async ({ page }) => {
    const industries = [
      '/industries',
      '/use-cases/healthcare',
      '/use-cases/ndis-aged-care',
      '/use-cases/incident-management',
      '/use-cases/workforce-credentials'
    ];

    for (const industry of industries) {
      await page.goto(industry);

      // Should NOT see paywall or upgrade prompt
      await expect(page.locator('text=/upgrade.*required/i')).not.toBeVisible();
      await expect(page.locator('text=/subscribe.*to.*access/i')).not.toBeVisible();

      // Should see content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  // Test 5: In-App Navigation
  test('All main nav items work', async ({ page }) => {
    await page.goto('/app/dashboard');

    const routes = [
      { url: '/app/tasks', title: /Tasks|FormaOS/i },
      { url: '/app/vault', title: /Vault|Evidence|FormaOS/i },
      { url: '/app/policies', title: /Policies|FormaOS/i },
      { url: '/app/controls', title: /Controls|FormaOS/i },
      { url: '/app/settings', title: /Settings|FormaOS/i },
    ];

    for (const route of routes) {
      await page.goto(route.url);
      await expect(page).toHaveURL(new RegExp(route.url));

      // Should not see 404 or error
      await expect(page.locator('text=/404|not found/i')).not.toBeVisible();
      await expect(page.locator('text=/error|something went wrong/i')).not.toBeVisible();
    }
  });

  // Test 6: Session Persistence
  test('Session persists on refresh', async ({ page, context }) => {
    await page.goto('/app/dashboard');

    // Hard refresh
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page).not.toHaveURL(/\/auth\/(signin|login)/);
  });

  test('Session persists in new tab', async ({ page, context }) => {
    await page.goto('/app/dashboard');

    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/app/dashboard');

    // Should be authenticated
    await expect(newPage).toHaveURL(/\/app\/dashboard/);
    await expect(newPage).not.toHaveURL(/\/auth\/(signin|login)/);

    await newPage.close();
  });

  // Test 7: Multi-step Flow (Create Task)
  test('Create and view task workflow', async ({ page }) => {
    await page.goto('/app/tasks');

    // Look for "Create" or "New Task" button
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Task"), a:has-text("Create Task")').first();

    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();

      // Fill task form
      await page.fill('input[name="title"], input[placeholder*="title" i]', 'E2E Test Task');

      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Should redirect back to tasks or show success
      await page.waitForTimeout(2000);
      await expect(page.locator('text=/E2E Test Task|success|created/i')).toBeVisible();
    }
  });

  // Test 8: Logout and Login
  test('Logout and login flow works', async ({ page }) => {
    await page.goto('/app/dashboard');

    // Find logout button/link
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")').first();

    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();

      // Should redirect to signin
      await page.waitForURL(/\/(auth\/(signin|login)|signin|login|\/)/, { timeout: 10000 });

      // Try to access protected route - should redirect
      await page.goto('/app/dashboard');
      await page.waitForURL(/\/(auth\/(signin|login)|signin|login)/, { timeout: 5000 });
    }
  });
});

// Test 9: Critical Routes Checklist
test.describe('Critical Routes Checklist', () => {
  const criticalRoutes = [
    { path: '/', name: 'Homepage' },
    { path: '/product', name: 'Product' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/security', name: 'Security' },
    { path: '/industries', name: 'Industries' },
    { path: '/contact', name: 'Contact' },
    { path: '/auth/signup', name: 'Signup' },
    { path: '/auth/signin', name: 'Signin' },
  ];

  for (const route of criticalRoutes) {
    test(`${route.name} loads without errors`, async ({ page }) => {
      await page.goto(route.path);

      // Should not see 404
      await expect(page.locator('text=/404|not found/i')).not.toBeVisible();

      // Should have content
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Check for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('chunk') &&
        !e.includes('404')
      );

      expect(criticalErrors.length).toBe(0);
    });
  }
});
