import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedIncident,
} from './helpers/workspace-seed';

test.describe('Incident investigation flow', () => {
  test('investigation tab shows a form, not a dead-end stub', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();
    const unique = Date.now();
    const incident = await seedIncident(context, {
      title: `E2E Investigation Incident ${unique}`,
      description: `Seeded for investigation flow test ${unique}`,
      severity: 'medium',
      category: 'operational',
    });
    const incidentId = (incident as { id?: string }).id;
    expect(incidentId).toBeTruthy();

    try {
      await authenticateWorkspacePage(page, context.email);
      await page.goto(`/app/incidents/${incidentId}/investigation`, {
        waitUntil: 'domcontentloaded',
      });

      await expect(
        page.getByText(/start investigation/i).first(),
      ).toBeVisible();
      await expect(page.getByRole('button').first()).toBeVisible();
    } finally {
      if (incidentId) {
        await context.admin
          .from('org_incidents')
          .delete()
          .eq('id', incidentId);
      }
    }
  });
});
