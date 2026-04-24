import { expect, test } from '@playwright/test';

import { authenticateWorkspacePage } from './helpers/workspace-seed';

test.describe('Forms — new form CTA', () => {
  test('/app/forms/builder/new creates a draft and redirects to the builder', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    await authenticateWorkspacePage(page);

    const response = await page.goto('/app/forms/builder/new', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/app\/forms(\/builder\/[^/]+)?/);
    expect(page.url()).not.toContain('/app/forms/builder/new');
  });
});
