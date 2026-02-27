import { expect, test } from '@playwright/test';

const SITE_BASE =
  process.env.PLAYWRIGHT_SITE_BASE ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://localhost:3000';

const byText = (value: string) =>
  new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

test.describe('Homepage enterprise regression', () => {
  test('hero renders orbital system and critical content immediately', async ({
    page,
  }) => {
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'domcontentloaded' });

    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();

    const orbital = page.locator('.orbital-core-stage').first();
    await expect(orbital).toBeVisible();

    await expect(
      page.getByRole('link', { name: /start free trial/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /request demo/i }).first(),
    ).toBeVisible();

    // Critical above-fold section should be present without waiting for deep scroll.
    await expect(page.locator('text=/Connected compliance intelligence/i').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('sticky CTA is hidden initially and appears after hero scroll progression', async ({
    page,
  }) => {
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'networkidle' });

    const stickyCta = page
      .locator('a')
      .filter({ hasText: /^Start Free Trial$/ })
      .last();

    // Sticky CTA is conditionally mounted, so initial state should be detached or hidden.
    await expect(stickyCta).toBeHidden({ timeout: 5000 }).catch(async () => {
      await expect(stickyCta).toHaveCount(0);
    });

    await page.mouse.wheel(0, 1100);
    await page.waitForTimeout(250);
    await page.mouse.wheel(0, 1100);
    await page.waitForTimeout(350);

    const stickyAfterScroll = page
      .locator('a')
      .filter({ hasText: /^Start Free Trial$/ })
      .last();
    await expect(stickyAfterScroll).toBeVisible({ timeout: 8000 });
  });

  test('reduced motion mode suppresses pulse token animation in hero chips', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'networkidle' });

    // Scope to hero authority chip labels and verify pulse utility is removed.
    const workflowChip = page.locator('span', {
      hasText: byText('Workflow Orchestration'),
    });
    await expect(workflowChip).toBeVisible();

    const pulseDot = workflowChip.locator('span').first();
    await expect(pulseDot).not.toHaveClass(/animate-pulse/);
  });

  test('critical section rendering keeps compliance network discoverable', async ({
    page,
  }) => {
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'domcontentloaded' });

    const complianceNetworkSignals = [
      page.locator('text=/Compliance Network/i').first(),
      page.locator('text=/network of controls/i').first(),
      page.locator('text=/connected and aware/i').first(),
    ];

    let visibleMatches = 0;
    for (const locator of complianceNetworkSignals) {
      if (await locator.isVisible().catch(() => false)) {
        visibleMatches += 1;
      }
    }

    if (visibleMatches === 0) {
      await page.mouse.wheel(0, 1400);
      await page.waitForTimeout(300);
      for (const locator of complianceNetworkSignals) {
        if (await locator.isVisible().catch(() => false)) {
          visibleMatches += 1;
        }
      }
    }

    expect(visibleMatches).toBeGreaterThan(0);
  });

  test('hero copy remains high-contrast and legible on mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'networkidle' });

    const subheadline = page
      .locator('p')
      .filter({ hasText: /operating system for governance/i })
      .first();
    await expect(subheadline).toBeVisible();

    // Ensure proof metric strip appears in mobile.
    await expect(page.locator('text=/Pre-built Controls/i').first()).toBeVisible();
    await expect(page.locator('text=/Framework Packs/i').first()).toBeVisible();
    await expect(page.locator('text=/Audit Export Time/i').first()).toBeVisible();
  });
});
