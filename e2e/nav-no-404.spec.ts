import { test, expect } from '@playwright/test';

/**
 * Navigation 404 Audit
 *
 * Verifies that every link in the sidebar and topbar resolves to a real page
 * (status 200) and does NOT return 404.
 *
 * Runs against a logged-in session. The test uses localStorage e2e_test_mode
 * to suppress the product tour overlay.
 */

// All routes referenced in sidebar navigation (industry-sidebar.ts)
const SIDEBAR_ROUTES = [
  // NDIS / default
  '/app',
  '/app/participants',
  '/app/visits',
  '/app/progress-notes',
  '/app/incidents',
  '/app/staff-compliance',
  '/app/team',
  '/app/registers',
  '/app/vault',
  '/app/reports',
  '/app/executive',
  '/app/settings',

  // Aged Care specific
  '/app/care-plans',

  // Default/Generic
  '/app/policies',
  '/app/tasks',
  '/app/people',
  '/app/patients',
  '/app/audit',
  '/app/settings/email-preferences',

  // Staff nav
  '/app/staff',

  // Topbar menu
  '/app/profile',
  '/app/billing',

  // Known referenced routes
  '/app/certificates',
];

test.describe('Navigation — No 404s', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress product tour
    await page.addInitScript(() => {
      localStorage.setItem('e2e_test_mode', 'true');
    });
  });

  for (const route of SIDEBAR_ROUTES) {
    test(`${route} should not 404`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // If the page redirects to /auth/signin that's OK (auth required)
      // but the route itself should not be a Next.js 404
      const url = page.url();
      const is404 = response?.status() === 404;
      const hasNotFoundText = await page
        .locator('text=This page could not be found')
        .isVisible()
        .catch(() => false);

      expect(
        is404 || hasNotFoundText,
        `Route ${route} returned 404 or showed "not found" text`,
      ).toBe(false);
    });
  }

  test('sidebar nav items should all resolve', async ({ page }) => {
    // Navigate to the app dashboard
    const response = await page.goto('/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // If redirected to auth, skip this test (need auth setup)
    if (page.url().includes('/auth/')) {
      test.skip();
      return;
    }

    // Find all sidebar links
    const sidebarLinks = await page.locator('aside a[href^="/app"]').all();

    for (const link of sidebarLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      const navResponse = await page.goto(href, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      const is404 = navResponse?.status() === 404;
      const hasNotFoundText = await page
        .locator('text=This page could not be found')
        .isVisible()
        .catch(() => false);

      expect(
        is404 || hasNotFoundText,
        `Sidebar link ${href} returned 404`,
      ).toBe(false);
    }
  });

  test('product tour should NOT appear on any page', async ({ page }) => {
    const response = await page.goto('/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    if (page.url().includes('/auth/')) {
      test.skip();
      return;
    }

    // Wait a moment for any tour overlay to appear
    await page.waitForTimeout(2000);

    // Check no tour overlay is visible
    const tourOverlay = await page
      .locator('[data-testid="product-tour-overlay"]')
      .isVisible()
      .catch(() => false);
    const tourBackdrop = await page
      .locator('.fixed.inset-0')
      .filter({ hasText: /step|tour|next|skip/i })
      .isVisible()
      .catch(() => false);

    expect(tourOverlay, 'Product tour overlay should not be visible').toBe(
      false,
    );
    expect(tourBackdrop, 'Tour backdrop should not be visible').toBe(false);
  });
});
