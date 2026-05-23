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

    // v4-031: was `[200,403,429]` which silently passed on 401 auth
    // regressions. v4-025 changed the no-customer path to return 409
    // `no_stripe_customer` instead of the infinite-loop simulated url,
    // so the contract is: 200 (portal url) when Stripe is wired, 409
    // when this org has no Stripe customer yet, or 429 if rate-limited.
    expect([200, 409, 429]).toContain(portalResponse.status());
    if (portalResponse.ok()) {
      const payload = await portalResponse.json();
      expect(payload.url).toContain('/app/billing');
    }
  });
});
