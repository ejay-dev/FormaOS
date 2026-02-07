/**
 * Care Industry Smoke Tests
 * Tests: Navigate care modules → verify pages load → test CRUD operations
 *
 * Uses standard E2E test credentials (E2E_TEST_EMAIL/PASSWORD)
 * Falls back to test helper credentials if not set
 */

import { test, expect, type Page } from '@playwright/test';
import { getTestCredentials, cleanupTestUser } from './helpers/test-auth';

// Test credentials - cached across tests
let testCredentials: { email: string; password: string } | null = null;

// Helper to get or create test credentials
async function getCredentials(): Promise<{ email: string; password: string }> {
  if (testCredentials) return testCredentials;

  // Use env vars if available (preferred for local dev)
  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    testCredentials = {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
    return testCredentials;
  }

  // Fall back to test-auth helper (creates user via service role if available)
  testCredentials = await getTestCredentials();
  return testCredentials;
}

// Helper to login
async function loginAs(page: Page, email: string, password: string) {
  // Set E2E test mode flag BEFORE navigating to prevent Product Tour from hijacking navigation
  await page.goto('/auth/signin');
  await page.evaluate(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });

  // Dismiss Product Tour if it still appears
  await dismissProductTour(page);
}

// Helper to dismiss Product Tour overlay
async function dismissProductTour(page: Page) {
  try {
    // Wait for network to settle first
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Look for the Product Tour by its text content
    const tourText = page.locator('text="Product Tour"');
    if (await tourText.isVisible({ timeout: 2000 })) {
      console.log('[E2E] Product Tour detected, dismissing...');

      // Find and click Skip Tour button
      const skipBtn = page.locator('button:has-text("Skip Tour")');
      await skipBtn.click({ timeout: 3000 });

      // Wait for tour to close
      await tourText.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('[E2E] Product Tour dismissed');

      // Extra wait for state persistence
      await page.waitForTimeout(500);
    }
  } catch (err) {
    // Tour not present or already closed
    console.log('[E2E] No Product Tour to dismiss');
  }
}

// Helper to check if element exists with timeout
async function isVisible(page: Page, selector: string, timeout = 3000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

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
    await page.goto('/app');

    // Should not show loading spinner forever
    const spinner = page.locator('[data-testid="loading-spinner"], .animate-spin');

    // Wait for content to appear (dashboard should load within 10s)
    await expect(page.locator('h1, [data-testid="dashboard-content"]')).toBeVisible({ timeout: 10000 });

    // Spinner should be gone
    await expect(spinner).not.toBeVisible({ timeout: 5000 });

    console.log('✓ Dashboard loaded without infinite spinner');
  });

  test('Sidebar navigation items are clickable', async ({ page }) => {
    await page.goto('/app');

    // Dismiss Product Tour if it appears
    await dismissProductTour(page);

    // Wait for sidebar to load
    await page.waitForLoadState('networkidle');

    // Check for common nav items (these exist across industries)
    const navItems = [
      { testId: 'nav-dashboard', expectedUrl: '/app' },
      { testId: 'nav-registers', expectedUrl: '/app/registers' },
      { testId: 'nav-vault', expectedUrl: '/app/vault' },
      { testId: 'nav-settings', expectedUrl: '/app/settings' },
    ];

    for (const item of navItems) {
      const navElement = page.getByTestId(item.testId);
      if (await navElement.isVisible()) {
        await navElement.click();
        // Wait for URL to change (Next.js client-side navigation)
        if (item.expectedUrl !== '/app') {
          await page.waitForURL(new RegExp(item.expectedUrl), { timeout: 5000 });
        }
        expect(page.url()).toContain(item.expectedUrl);
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
    await page.goto('/app/participants');
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
    await page.goto('/app/participants');
    await dismissProductTour(page);

    await expect(page.getByTestId('add-participant-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-participant-btn').click();

    await page.waitForURL('/app/participants/new', { timeout: 5000 });

    // Form should be visible (use form with full_name input to avoid strict mode violation)
    const participantForm = page.locator('form').filter({ has: page.locator('input[name="full_name"]') });
    await expect(participantForm).toBeVisible();
    await expect(page.locator('input[name="full_name"]')).toBeVisible();

    console.log('✓ Participant form accessible');
  });

  test('Participant form is accessible', async ({ page }) => {
    await page.goto('/app/participants/new');
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
    await page.goto('/app/visits');

    await expect(page.getByTestId('visits-title')).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show stats cards
    const statsCards = page.locator('.rounded-xl.border');
    await expect(statsCards.first()).toBeVisible();

    console.log('✓ Visits page loaded correctly');
  });

  test('Add visit button is accessible', async ({ page }) => {
    await page.goto('/app/visits');

    const addBtn = page.getByTestId('add-visit-btn');
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    await addBtn.click();
    await page.waitForURL('/app/visits/new', { timeout: 5000 });

    // Form should have required fields
    await expect(page.locator('select[name="client_id"]')).toBeVisible();

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
    await page.goto('/app/incidents');

    await expect(page.getByTestId('incidents-title')).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show stats or empty state
    const hasStats = await isVisible(page, '.rounded-xl.border');
    expect(hasStats).toBe(true);

    console.log('✓ Incidents page loaded correctly');
  });

  test('Report incident button exists', async ({ page }) => {
    await page.goto('/app/incidents');

    const reportBtn = page.getByTestId('report-incident-btn');
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
    await page.goto('/app/staff-compliance');

    await expect(page.getByTestId('staff-compliance-title')).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Should show stats cards
    const statsCards = page.locator('.rounded-xl.border');
    await expect(statsCards.first()).toBeVisible();

    console.log('✓ Staff compliance page loaded correctly');
  });

  test('Add credential button exists', async ({ page }) => {
    await page.goto('/app/staff-compliance');

    const addBtn = page.getByTestId('add-credential-btn');
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
    await page.goto('/app/registers');

    await expect(page.getByTestId('registers-title')).toBeVisible({ timeout: 10000 });

    // Should not be stuck loading
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    console.log('✓ Registers page loaded correctly');
  });

  test('Care registers grid shows for care industries', async ({ page }) => {
    await page.goto('/app/registers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if care registers grid exists (depends on org industry)
    const careGrid = page.getByTestId('care-registers-grid');
    const hasCareGrid = await careGrid.isVisible().catch(() => false);

    if (hasCareGrid) {
      // Verify register links
      await expect(page.getByTestId('register-clients')).toBeVisible();
      await expect(page.getByTestId('register-incidents')).toBeVisible();
      await expect(page.getByTestId('register-visits')).toBeVisible();
      await expect(page.getByTestId('register-staff')).toBeVisible();
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

    await page.goto('/app/participants');

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
