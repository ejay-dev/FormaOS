import { test, expect } from '@playwright/test';
import { getCredentials, loginAs } from './helpers/fixtures';

/**
 * Navigation 404 Audit
 *
 * Verifies that every link in the sidebar and topbar resolves to a real page
 * (status 200) and does NOT return 404.
 *
 * Runs against a logged-in session. Previously the beforeEach only set the
 * e2e_test_mode localStorage flag and never installed a session, so every
 * /app/* navigation was redirected to /auth/signin by the /app layout
 * (app/app/layout.tsx). The sign-in page returns 200 and contains no
 * "not found" copy, so all 24 route assertions passed unconditionally — a
 * deleted route would not have been noticed. loginAs() installs a real
 * Supabase session and also sets e2e_test_mode to suppress the product tour.
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
  '/app/audit-trail',
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
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  for (const route of SIDEBAR_ROUTES) {
    test(`${route} should not 404`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      expect(response, `Route ${route} produced no response`).not.toBeNull();
      expect(
        response!.status(),
        `Route ${route} returned HTTP ${response!.status()}`,
      ).toBeLessThan(400);

      await expect(
        page.locator('text=This page could not be found'),
        `Route ${route} rendered the Next.js not-found page`,
      ).toHaveCount(0);

      // The session must have survived the navigation. Without this the
      // whole suite silently degrades to asserting things about
      // /auth/signin, which is how it became unfalsifiable.
      expect(
        new URL(page.url()).pathname,
        `Route ${route} bounced to sign-in — the authenticated session was not established`,
      ).not.toMatch(/^\/(auth|unauthorized)/);
    });
  }

  test('sidebar nav items should all resolve', async ({ page }) => {
    // Navigate to the app dashboard
    await page.goto('/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(
      new URL(page.url()).pathname,
      'authenticated /app landed on the auth surface',
    ).not.toMatch(/^\/auth/);

    // Find all sidebar links
    const sidebarLinks = await page.locator('aside a[href^="/app"]').all();
    expect(
      sidebarLinks.length,
      'no sidebar links were rendered — the app shell did not load',
    ).toBeGreaterThan(0);

    const hrefs = (
      await Promise.all(sidebarLinks.map((link) => link.getAttribute('href')))
    ).filter((href): href is string => Boolean(href));

    for (const href of hrefs) {
      const navResponse = await page.goto(href, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      expect(navResponse, `Sidebar link ${href} produced no response`).not.toBeNull();
      expect(
        navResponse!.status(),
        `Sidebar link ${href} returned HTTP ${navResponse!.status()}`,
      ).toBeLessThan(400);

      await expect(
        page.locator('text=This page could not be found'),
        `Sidebar link ${href} rendered the Next.js not-found page`,
      ).toHaveCount(0);
    }
  });

  test('product tour should NOT appear on any page', async ({ page }) => {
    await page.goto('/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(
      new URL(page.url()).pathname,
      'authenticated /app landed on the auth surface',
    ).not.toMatch(/^\/auth/);

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
