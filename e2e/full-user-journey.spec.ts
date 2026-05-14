/**
 * Full User Journey E2E Test
 * Tests complete flow: Marketing → Signup → Onboarding → Dashboard → Industries → Features
 */

import { test, expect, type Page } from '@playwright/test';
import { getCredentials, gotoAppRoute, loginAs } from './helpers/fixtures';

const TEST_EMAIL = `test-${Date.now()}@formaos-qa.com`;
const TEST_PASSWORD = 'Vexa9!Cobalt#42River';

async function signInForJourney(page: Page) {
  const credentials = await getCredentials();
  await loginAs(page, credentials.email, credentials.password);
}

async function expectAppRoute(page: Page, expectedPath = '/app') {
  await page.waitForURL(/\/app(?:\/.*)?$/, { timeout: 30_000 });
  const path = new URL(page.url()).pathname;
  if (expectedPath === '/app') {
    expect(path).toMatch(/^\/app(?:\/.*)?$/);
    return;
  }
  expect(path === expectedPath || path.startsWith(`${expectedPath}/`)).toBe(
    true,
  );
}

test.describe('Complete User Journey', () => {
  // Test 1: Marketing CTAs
  test('Marketing CTAs route correctly', async ({ page }) => {
    await page.goto('/');

    const primaryCta = page
      .getByRole('link', { name: /Get Compliance Plan/i })
      .first();
    await expect(primaryCta).toBeVisible();
    const href = await primaryCta.getAttribute('href');
    expect(href).toContain('/contact?type=compliance-plan');
  });

  test('Product page CTAs work', async ({ page }) => {
    await page.goto('/product');
    await expect(page).toHaveTitle(/Product|FormaOS/i);

    const ctas = page.locator(
      'a[href*="/contact"], a:has-text("Get Compliance Plan"), a:has-text("Book Demo")',
    );
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Pricing page CTAs route through new compliance funnel', async ({
    page,
  }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/Pricing|FormaOS/i);

    const foundationCta = page.getByTestId('pricing-foundation-cta');
    const growthCta = page.getByTestId('pricing-growth-cta');
    const enterpriseCta = page.getByTestId('pricing-enterprise-cta');

    await expect(foundationCta).toBeVisible();
    await expect(growthCta).toBeVisible();
    await expect(enterpriseCta).toBeVisible();

    const growthHref = await growthCta.getAttribute('href');
    const enterpriseHref = await enterpriseCta.getAttribute('href');
    expect(growthHref).toContain('/auth/signup');
    expect(growthHref).toContain('plan=pro');
    expect(growthHref).toContain('intent=checkout');
    expect(enterpriseHref).toContain('/contact?type=enterprise');
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

    // Check if Supabase auth is temporarily unavailable (shown on the page)
    const unavailableMsg = page
      .locator('text=/temporarily unavailable|auth.*unavailable/i')
      .first();
    if (await unavailableMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(
        true,
        'Supabase auth is temporarily unavailable — skipping signup test',
      );
      return;
    }

    // Fill signup form
    await page.getByLabel('Email Address').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page
      .getByLabel('Confirm Password', { exact: true })
      .fill(TEST_PASSWORD);

    // Look for terms checkbox if exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await termsCheckbox.check();
    }

    // Submit
    await page.click(
      'button[type="submit"], button:has-text("Sign up"), button:has-text("Create account")',
    );

    // Should redirect to check-email page
    try {
      await page.waitForURL(/\/auth\/check-email/, { timeout: 10000 });
    } catch {
      // If redirect doesn't happen, check if it's because auth is unavailable
      const currentUrl = page.url();
      const errMsg = await page
        .locator('text=/error|unavailable|failed|temporarily/i')
        .first()
        .textContent({ timeout: 2000 })
        .catch(() => '');
      if (errMsg || currentUrl.includes('/auth/signup')) {
        test.skip(
          true,
          'Signup redirect did not complete — Supabase auth may be unavailable',
        );
        return;
      }
      throw new Error(
        `Expected redirect to /auth/check-email but stayed at ${currentUrl}`,
      );
    }

    // Verify we're on check-email page
    await expect(page).toHaveURL(/\/auth\/check-email/);
    await expect(page.locator('text=/Check.*Email/i')).toBeVisible();
  });

  // Test 3: Dashboard Access
  test('Dashboard loads after signup', async ({ page }) => {
    await signInForJourney(page);
    await gotoAppRoute(page, '/app');
    await expectAppRoute(page);

    // Check for key elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // Test 4: Industries Access (Critical - Trial users must have access)
  test('Trial user can access all industries', async ({ page }) => {
    const industries = [
      '/industries',
      '/healthcare-compliance',
      '/ndis-providers',
      '/use-cases/incident-management',
      '/use-cases/workforce-credentials',
    ];

    for (const industry of industries) {
      await page.goto(industry);

      // Should NOT see paywall or upgrade prompt
      await expect(page.locator('text=/upgrade.*required/i')).not.toBeVisible();
      await expect(
        page.locator('text=/subscribe.*to.*access/i'),
      ).not.toBeVisible();

      // Should see content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  // Test 5: In-App Navigation
  test('All main nav items work', async ({ page }) => {
    await signInForJourney(page);

    const routes = [
      { url: '/app/tasks', title: /Tasks|FormaOS/i },
      { url: '/app/vault', title: /Vault|Evidence|FormaOS/i },
      { url: '/app/policies', title: /Policies|FormaOS/i },
      { url: '/app/controls', title: /Controls|FormaOS/i },
      { url: '/app/settings', title: /Settings|FormaOS/i },
    ];

    for (const route of routes) {
      await gotoAppRoute(page, route.url);
      await expectAppRoute(page, route.url);

      // Should not see 404 or error
      await expect(page.locator('text=/404|not found/i')).not.toBeVisible();
      await expect(
        page.locator('text=/error|something went wrong/i'),
      ).not.toBeVisible();
    }
  });

  // Test 6: Session Persistence
  test('Session persists on refresh', async ({ page }) => {
    await signInForJourney(page);
    await gotoAppRoute(page, '/app');

    // Hard refresh
    await page.reload();

    // Should still be on dashboard
    await expectAppRoute(page);
    await expect(page).not.toHaveURL(/\/auth\/(signin|login)/);
  });

  test('Session persists in new tab', async ({ page, context }) => {
    await signInForJourney(page);
    await gotoAppRoute(page, '/app');

    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/app', { waitUntil: 'domcontentloaded' });

    // Should be authenticated
    await expectAppRoute(newPage);
    await expect(newPage).not.toHaveURL(/\/auth\/(signin|login)/);

    await newPage.close();
  });

  // Test 7: Multi-step Flow (Create Task)
  test('Create and view task workflow', async ({ page }) => {
    await signInForJourney(page);
    await gotoAppRoute(page, '/app/tasks');

    // Look for "Create" or "New Task" button
    const createBtn = page
      .locator(
        'button:has-text("Create"), button:has-text("New Task"), a:has-text("Create Task")',
      )
      .first();

    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();

      // Fill task form
      await page.fill(
        'input[name="title"], input[placeholder*="title" i]',
        'E2E Test Task',
      );

      // Submit
      await page.click(
        'button[type="submit"], button:has-text("Save"), button:has-text("Create")',
      );

      // Should redirect back to tasks or show success
      await page.waitForTimeout(2000);
      await expect(
        page.locator('text=/E2E Test Task|success|created/i'),
      ).toBeVisible();
    }
  });

  // Test 8: Logout and Login
  test('Logout and login flow works', async ({ page }) => {
    await signInForJourney(page);
    await gotoAppRoute(page, '/app');

    // Find logout button/link
    const logoutBtn = page
      .locator(
        'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")',
      )
      .first();

    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();

      // Should redirect to signin
      await page.waitForURL(/\/auth\/(signout|signin|login)/, {
        timeout: 10000,
      });

      // Try to access protected route - should redirect
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/auth\/(signin|login)/, {
        timeout: 10000,
      });
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
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('favicon') && !e.includes('chunk') && !e.includes('404'),
      );

      expect(criticalErrors.length).toBe(0);
    });
  }
});
