import { expect, test } from '@playwright/test';

import { authenticateWorkspacePage } from './helpers/workspace-seed';

test.describe('Dashboard truthfulness', () => {
  test('Pulse tab does not render fabricated trend data', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    await authenticateWorkspacePage(page);
    await page.goto('/app', { waitUntil: 'domcontentloaded' });

    const pulseTab = page.getByRole('button', { name: /^pulse$/i }).first();
    if (await pulseTab.count()) {
      await pulseTab.click();
    }

    // The synthetic "vs. previous 30d" caption used to anchor fake sparklines.
    await expect(page.getByText('vs. previous 30d')).toHaveCount(0);
  });

  test('Records tab does not show the old fabricated actor names', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    await authenticateWorkspacePage(page);
    await page.goto('/app', { waitUntil: 'domcontentloaded' });

    const recordsTab = page.getByRole('button', { name: /^records$/i }).first();
    if (await recordsTab.count()) {
      await recordsTab.click();
    }

    await expect(page.getByText(/Priya Natarajan/)).toHaveCount(0);
    await expect(page.getByText(/Alex Chen/)).toHaveCount(0);
  });
});
