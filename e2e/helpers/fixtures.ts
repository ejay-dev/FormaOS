/**
 * Shared E2E Test Fixtures
 *
 * Provides reusable `loginAs`, `getCredentials`, and `dismissProductTour`
 * helpers so spec files don't copy-paste the same boilerplate.
 *
 * Usage:
 *   import { loginAs, getCredentials, dismissProductTour } from './helpers/fixtures';
 *
 * Migration: Replace inline copies in spec files with imports from here.
 */

import type { Page } from '@playwright/test';
import { getTestCredentials } from './test-auth';

let cachedCredentials: { email: string; password: string } | null = null;

/**
 * Get test credentials from env vars or create a temporary test user.
 * Caches per-process so the first call resolves credentials for the run.
 */
export async function getCredentials(): Promise<{
  email: string;
  password: string;
}> {
  if (cachedCredentials) return cachedCredentials;

  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    cachedCredentials = {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
    return cachedCredentials;
  }

  cachedCredentials = await getTestCredentials();
  return cachedCredentials;
}

/**
 * Log in as a user via the signin form.
 * Waits for the /app route to load and dismisses the product tour.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/auth/signin');
  await page.evaluate(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });
  await dismissProductTour(page);
}

/**
 * Dismiss the product tour overlay if it appears.
 * Silently succeeds if no tour is shown.
 */
export async function dismissProductTour(page: Page): Promise<void> {
  try {
    await page
      .waitForLoadState('domcontentloaded', { timeout: 5000 })
      .catch(() => {});
    const tourText = page.locator('text="Product Tour"');
    if (await tourText.isVisible({ timeout: 2000 })) {
      const skipBtn = page.locator('button:has-text("Skip Tour")');
      await skipBtn.click({ timeout: 3000 });
      await tourText.waitFor({ state: 'hidden', timeout: 5000 });
    }
  } catch {
    // Tour not present — no action needed
  }
}
