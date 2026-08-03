/**
 * Care Industry Smoke Tests
 * Tests: Navigate care modules → verify pages load → test CRUD operations
 *
 * Uses standard E2E test credentials (E2E_TEST_EMAIL/PASSWORD)
 * Falls back to test helper credentials if not set
 */

import { test, expect, type Page } from '@playwright/test';
import { cleanupTestUser } from './helpers/test-auth';
import {
  dismissProductTour,
  getCredentials,
  gotoAppRoute,
  loginAs,
  waitForAppReady,
} from './helpers/fixtures';

// Helper to check if element exists with timeout
async function isVisible(page: Page, selector: string, timeout = 3000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe.configure({ mode: 'serial' });

// =========================================================
// CARE INDUSTRY NAVIGATION TESTS
// =========================================================
test.describe('Care Industry Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test.afterAll(async () => {
    // Only cleanup if we created a temp user
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  test('Dashboard loads without infinite spinner', async ({ page }) => {
    await gotoAppRoute(page, '/app');

    // Should not show loading spinner forever
    const spinner = page.locator('[data-testid="loading-spinner"], .animate-spin');

    // Wait for content to appear (dashboard should load within 10s)
    await expect(page.locator('h1, [data-testid="dashboard-content"]')).toBeVisible({ timeout: 10000 });

    // Spinner should be gone
    await expect(spinner).not.toBeVisible({ timeout: 5000 });

    console.log('✓ Dashboard loaded without infinite spinner');
  });

  test('Sidebar navigation items are clickable', async ({ page }) => {
    // app/app/layout.tsx:246 renders the sidebar as `hidden md:flex`, so below
    // 768px the nav links are in the DOM but never visible, and the Mobile
    // Chrome (Pixel 5, 393px) / Mobile Safari projects in playwright.config.ts
    // would fail on visibility rather than on any regression. The mobile
    // surface is components/mobile/bottom-nav.tsx, which carries no nav-*
    // testids, so there is nothing here to assert on a narrow viewport.
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width < 768, 'Sidebar is desktop-only (hidden below the md breakpoint)');

    await gotoAppRoute(page, '/app');

    // Dismiss Product Tour if it appears
    await dismissProductTour(page);

    // 2026-08-02: every assertion used to sit inside
    // `if (await navElement.isVisible())`. A sidebar that failed to render —
    // the exact regression this test is named for — skipped the loop body
    // for all four items and passed with zero assertions.

    // The sidebar must render *something*: the thinnest of the eleven
    // industry variants in lib/navigation/industry-sidebar.ts still ships
    // well over five nav entries.
    const sidebarLinks = page.locator('[data-testid^="nav-"]');
    expect(
      await sidebarLinks.count(),
      'Sidebar rendered no navigation items',
    ).toBeGreaterThanOrEqual(5);

    // nav-dashboard and nav-vault are the two testIds present in ALL
    // industry navigation sets, so they can be asserted unconditionally.
    const navItems = [
      { testId: 'nav-dashboard', expectedUrl: '/app' },
      { testId: 'nav-vault', expectedUrl: '/app/vault' },
    ];

    for (const item of navItems) {
      // Start somewhere else so the click is a genuine navigation.
      const startRoute = item.expectedUrl === '/app' ? '/app/vault' : '/app';
      await gotoAppRoute(page, startRoute);
      await dismissProductTour(page);

      const navElement = page.getByTestId(item.testId).first();
      await expect(
        navElement,
        `${item.testId} is missing from the sidebar`,
      ).toBeVisible({ timeout: 30_000 });
      await expect(navElement).toHaveAttribute('href', item.expectedUrl);
      await navElement.click();
      await page.waitForURL((url) => url.pathname === item.expectedUrl, {
        timeout: 30_000,
      });
      await waitForAppReady(page, {
        expectedPath: item.expectedUrl,
        timeout: 30_000,
      });
    }
  });
});

// =========================================================
// PARTICIPANTS/PATIENTS/RESIDENTS PAGE TESTS
// =========================================================
test.describe('Participants Page', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Participants page loads with proper states', async ({ page }) => {
    console.log('[E2E] Navigating to /app/participants...');
    await gotoAppRoute(page, '/app/participants');
    console.log('[E2E] After goto, URL is:', page.url());

    // Dismiss Product Tour if it reappears after navigation
    await dismissProductTour(page);
    console.log('[E2E] After dismissProductTour, URL is:', page.url());

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    console.log('[E2E] After networkidle, URL is:', page.url());

    // Should show title
    await expect(page.getByTestId('participants-title')).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin, [aria-label="Loading"]');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show either data table or empty state
    const hasTable = await isVisible(page, 'table, [data-testid="participants-table"]');
    const hasEmptyState = await isVisible(page, 'text=/No .* found|Add your first/i');

    expect(hasTable || hasEmptyState).toBe(true);
    console.log('✓ Participants page loaded correctly');
  });

  test('Add participant button navigates to form', async ({ page }) => {
    await gotoAppRoute(page, '/app/participants');
    await dismissProductTour(page);

    const addParticipantButton = page.getByTestId('add-participant-btn').first();
    await expect(addParticipantButton).toBeVisible({ timeout: 10000 });
    await addParticipantButton.click();

    await page.waitForURL('/app/participants/new', { timeout: 5000 });

    // Form should be visible (use form with full_name input to avoid strict mode violation)
    const participantForm = page.locator('form').filter({ has: page.locator('input[name="full_name"]') });
    await expect(participantForm).toBeVisible();
    await expect(page.locator('input[name="full_name"]')).toBeVisible();

    console.log('✓ Participant form accessible');
  });

  test('Participant form is accessible', async ({ page }) => {
    await gotoAppRoute(page, '/app/participants/new');
    await dismissProductTour(page);

    // Form should be visible (use form with full_name input)
    const participantForm = page.locator('form').filter({ has: page.locator('input[name="full_name"]') });
    await expect(participantForm).toBeVisible({ timeout: 10000 });

    // Required fields should exist
    await expect(page.locator('input[name="full_name"]')).toBeVisible();

    // Submit button should exist
    await expect(participantForm.locator('button[type="submit"]')).toBeVisible();

    console.log('✓ Participant form accessible');
  });
});

// =========================================================
// VISITS/APPOINTMENTS PAGE TESTS
// =========================================================
test.describe('Visits Page', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Visits page loads without errors', async ({ page }) => {
    await gotoAppRoute(page, '/app/visits');

    await expect(page.getByTestId('visits-title').first()).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show stats cards
    const statsCards = page.locator('.rounded-xl.border');
    await expect(statsCards.first()).toBeVisible();

    console.log('✓ Visits page loaded correctly');
  });

  test('Add visit button is accessible', async ({ page }) => {
    await gotoAppRoute(page, '/app/visits');

    const addBtn = page.getByTestId('add-visit-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    await addBtn.click();
    await page.waitForURL('/app/visits/new', { timeout: 5000 });

    // Form should have required fields
    await expect(page.locator('select[name="client_id"]')).toBeVisible({
      timeout: 30_000,
    });

    console.log('✓ Visit form accessible');
  });
});

// =========================================================
// INCIDENTS PAGE TESTS
// =========================================================
test.describe('Incidents Page', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Incidents page loads without errors', async ({ page }) => {
    await gotoAppRoute(page, '/app/incidents');

    await expect(page.getByTestId('incidents-title').first()).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show stats or empty state
    const hasStats = await isVisible(page, '.rounded-xl.border');
    expect(hasStats).toBe(true);

    console.log('✓ Incidents page loaded correctly');
  });

  test('Report incident button exists', async ({ page }) => {
    await gotoAppRoute(page, '/app/incidents');

    const reportBtn = page.getByTestId('report-incident-btn').first();
    await expect(reportBtn).toBeVisible({ timeout: 10000 });

    console.log('✓ Report incident button accessible');
  });
});

// =========================================================
// STAFF COMPLIANCE PAGE TESTS
// =========================================================
test.describe('Staff Compliance Page', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Staff compliance page loads without errors', async ({ page }) => {
    await gotoAppRoute(page, '/app/staff-compliance');

    await expect(page.getByTestId('staff-compliance-title').first()).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show stats cards
    const statsCards = page.locator('.rounded-xl.border');
    await expect(statsCards.first()).toBeVisible();

    console.log('✓ Staff compliance page loaded correctly');
  });

  test('Add credential button exists', async ({ page }) => {
    await gotoAppRoute(page, '/app/staff-compliance');

    const addBtn = page.getByTestId('add-credential-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    console.log('✓ Add credential button accessible');
  });
});

// =========================================================
// REGISTERS PAGE TESTS
// =========================================================
test.describe('Registers Page', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Registers page loads without errors', async ({ page }) => {
    await gotoAppRoute(page, '/app/registers');

    await expect(page.getByTestId('registers-title').first()).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    console.log('✓ Registers page loaded correctly');
  });

  test('Care registers grid shows for care industries', async ({ page }) => {
    await gotoAppRoute(page, '/app/registers');

    await expect(page.getByTestId('registers-title').first()).toBeVisible({
      timeout: 10000,
    });

    // 2026-08-02: every register-link assertion used to live inside
    // `if (hasCareGrid)`, so a care org that stopped rendering the grid
    // silently took the else branch and passed. The page subtitle is driven
    // by the same `isCareIndustry` flag as the grid (app/app/registers/
    // page.tsx), so it tells us which branch is authoritative — and both
    // branches now assert.
    const careSubtitle = page.getByText(
      'Access client, incident, service, and compliance registers.',
    );
    const assetSubtitle = page.getByText(
      'Monitor asset health and security risk levels.',
    );
    await expect(careSubtitle.or(assetSubtitle).first()).toBeVisible();

    const careGrid = page.getByTestId('care-registers-grid');

    if ((await careSubtitle.count()) > 0) {
      await expect(careGrid).toBeVisible();
      for (const register of ['clients', 'incidents', 'visits', 'staff']) {
        await expect(
          page.getByTestId(`register-${register}`).first(),
          `care register link "${register}" missing`,
        ).toBeVisible();
      }
    } else {
      // Non-care industry: the care grid must not leak onto the page.
      await expect(assetSubtitle).toBeVisible();
      await expect(careGrid).toHaveCount(0);
    }
  });
});

// =========================================================
// ERROR HANDLING TESTS
// =========================================================
test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    const creds = await getCredentials();
    await loginAs(page, creds.email, creds.password);
  });

  test('Pages handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/rest/v1/**', route => {
      route.abort('failed');
    });

    await gotoAppRoute(page, '/app/participants');

    // Should show error message, not crash or infinite load
    await page.waitForTimeout(3000);

    // Page should still be interactive
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should not show infinite spinner
    const spinnerCount = await page.locator('.animate-spin').count();
    expect(spinnerCount).toBeLessThanOrEqual(1); // Allow one spinner max

    console.log('✓ Page handles API errors gracefully');
  });
});
