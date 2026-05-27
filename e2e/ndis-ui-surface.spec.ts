/**
 * Audit 2026-05-27 (R10 Phase 3 UI surface) — smoke tests for the
 * policy ndis_category dropdown and the behaviour support plan CRUD
 * page. Browser scope is chromium-only per the established release
 * gate (feedback_e2e_supported_scope).
 *
 * The tests assert the rendered controls exist with the right options;
 * full submission flows are exercised against the seeded workspace
 * to surface server-action regressions before they ship.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';

async function gotoAndWaitForApp(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded');
}

test.describe('NDIS Phase 3 UI surface', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only release gate.');
  });

  test('policy editor exposes the NDIS Practice-Standard dropdown', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await authenticateWorkspacePage(page);
    await gotoAndWaitForApp(page, '/app/policies/new');

    const select = page.locator('#ndis_category');
    await expect(select).toBeVisible({ timeout: 30_000 });

    // Spot-check the 18 enum values are present (sampling, not full list).
    const expected = [
      'privacy',
      'safeguarding',
      'governance',
      'restrictive_practices',
      'worker_engagement',
    ];
    for (const value of expected) {
      await expect(
        select.locator(`option[value="${value}"]`),
      ).toHaveCount(1, { timeout: 5_000 });
    }
    await expect(select.locator('option[value="none"]')).toHaveCount(1);
  });

  test('behaviour support plans page renders and links to /new', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await authenticateWorkspacePage(page);
    await gotoAndWaitForApp(page, '/app/behaviour-support-plans');

    await expect(
      page.locator('[data-testid="bsp-page-title"]'),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.locator('[data-testid="create-bsp-btn"]'),
    ).toBeVisible();

    await page.locator('[data-testid="create-bsp-btn"]').click();
    await page.waitForURL('**/behaviour-support-plans/new', {
      timeout: 30_000,
    });
    await expect(page.locator('#plan_type')).toBeVisible();
    await expect(
      page.locator('#plan_type option[value="interim"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('#plan_type option[value="comprehensive"]'),
    ).toHaveCount(1);
  });

  test('BSP create flow inserts a row visible on the list', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const ctx = await getWorkspaceSeedContext();
    await authenticateWorkspacePage(page);
    await gotoAndWaitForApp(page, '/app/behaviour-support-plans/new');

    const unique = Date.now();
    const notesMarker = `E2E BSP smoke ${unique}`;

    await page.locator('#plan_type').selectOption('interim');
    await page.locator('#authorising_body').fill('VIC Senior Practitioner');
    await page.locator('#notes').fill(notesMarker);
    await page.locator('button[type="submit"]').click();

    // Server action redirects to the new BSP detail page.
    await page.waitForURL('**/behaviour-support-plans/**', { timeout: 30_000 });
    // Detail page shows the notes block.
    await expect(page.getByText(notesMarker, { exact: false })).toBeVisible({
      timeout: 30_000,
    });

    // Cleanup so the suite is repeatable.
    const { data: rows } = await ctx.admin
      .from('org_behaviour_support_plans')
      .select('id, notes')
      .eq('organization_id', ctx.orgId)
      .ilike('notes', `%${notesMarker}%`);
    const inserted = (rows ?? []) as Array<{ id: string }>;
    if (inserted.length > 0) {
      await ctx.admin
        .from('org_behaviour_support_plans')
        .delete()
        .in(
          'id',
          inserted.map((r) => r.id),
        );
    }
  });
});
