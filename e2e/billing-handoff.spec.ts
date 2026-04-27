import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';

test.describe('Billing handoff smoke', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Billing handoff smoke runs once on chromium');
  });

  test('billing page and portal endpoint fail safely when Stripe is unavailable', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    await authenticateWorkspacePage(page);

    const response = await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('This page could not be found');

    const portalResponse = await page.request.post('/api/billing/portal', {
      data: { orgId: context.orgId },
    });

    expect([200, 403, 429]).toContain(portalResponse.status());
    if (portalResponse.ok()) {
      const payload = await portalResponse.json();
      expect(payload.url).toContain('/app/billing');
    }
  });
});
