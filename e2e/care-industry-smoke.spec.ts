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
    await gotoAppRoute(page, '/app');

    // Dismiss Product Tour if it appears
    await dismissProductTour(page);

    // Check for common nav items (these exist across industries)
    const navItems = [
      { testId: 'nav-dashboard', expectedUrl: '/app' },
      { testId: 'nav-registers', expectedUrl: '/app/registers' },
      { testId: 'nav-vault', expectedUrl: '/app/vault' },
      { testId: 'nav-settings', expectedUrl: '/app/settings' },
    ];

    for (const item of navItems) {
      await gotoAppRoute(page, item.expectedUrl === '/app' ? '/app/settings' : '/app');
      await dismissProductTour(page);

      const navElement = page.getByTestId(item.testId).first();
      if (await navElement.isVisible()) {
        await expect(navElement).toHaveAttribute('href', item.expectedUrl);
        await navElement.click();
        await page.waitForURL(
          (url) => url.pathname === item.expectedUrl,
          { timeout: 30_000 },
        );
        await waitForAppReady(page, {
          expectedPath: item.expectedUrl,
          timeout: 30_000,
        });
        console.log(`✓ ${item.testId} navigates correctly`);
      }
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

    // Check if care registers grid exists (depends on org industry)
    const careGrid = page.getByTestId('care-registers-grid');
    const hasCareGrid = await careGrid.isVisible().catch(() => false);

    if (hasCareGrid) {
      // Verify register links
      await expect(page.getByTestId('register-clients').first()).toBeVisible();
      await expect(page.getByTestId('register-incidents').first()).toBeVisible();
      await expect(page.getByTestId('register-visits').first()).toBeVisible();
      await expect(page.getByTestId('register-staff').first()).toBeVisible();
      console.log('✓ Care registers grid displayed');
    } else {
      // Non-care industry - should show asset registers
      console.log('ℹ Org is not care industry - showing asset registers');
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
