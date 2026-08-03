import { expect, test, type Page } from '@playwright/test';

import { authenticateWorkspacePage } from './helpers/workspace-seed';

async function openDashboard(page: Page) {
  await page.goto('/app', { waitUntil: 'commit', timeout: 60_000 });
  await expect(
    page.getByRole('heading', { name: /Dashboard/i }).first(),
  ).toBeVisible({ timeout: 30_000 });
}

/**
 * The dashboard is the first screen of a compliance product, so anything it
 * states has to be something the workspace can actually back up. These
 * assertions pin the specific fabrications that have been removed from it,
 * so they cannot return unnoticed.
 */
test.describe('Dashboard truthfulness', () => {
  test('renders no fabricated data', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    await authenticateWorkspacePage(page);
    await openDashboard(page);

    // Synthetic trend caption that anchored sparklines with no history behind
    // them, and seeded actor names that were never real users.
    await expect(page.getByText('vs. previous 30d')).toHaveCount(0);
    await expect(page.getByText(/Priya Natarajan/)).toHaveCount(0);
    await expect(page.getByText(/Alex Chen/)).toHaveCount(0);

    // Owner and SLA chips on the priority queue were literal strings dressed
    // as live operational assignments.
    await expect(page.getByText('Compliance Ops', { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText('Evidence Owners', { exact: true })).toHaveCount(
      0,
    );
  });
});
