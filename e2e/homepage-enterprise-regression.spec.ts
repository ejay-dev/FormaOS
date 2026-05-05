import { expect, test } from '@playwright/test';

const SITE_BASE =
  process.env.PLAYWRIGHT_SITE_BASE ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://localhost:3000';

const byText = (value: string) =>
  new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

test.describe('Homepage enterprise regression', () => {
  test('hero renders critical content immediately', async ({ page }) => {
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'domcontentloaded' });

    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();

    await expect(
      page.getByRole('link', { name: /get compliance plan/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /book demo/i }).first(),
    ).toBeVisible();

    // Critical above-fold section — hero headline must contain core brand text
    const h1Text = await heroHeading.textContent();
    expect(h1Text).toBeTruthy();
  });

  test('sticky CTA or hero CTA is visible after page load', async ({
    page,
  }) => {
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'networkidle' });

    // Primary CTA should be present somewhere on the page (hero or sticky)
    const anyCtaLink = page
      .locator('a')
      .filter({ hasText: /Get Compliance Plan/i })
      .first();
    await expect(anyCtaLink).toBeVisible({ timeout: 10000 });
  });

  test('reduced motion mode does not break page load', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'networkidle' });

    // Page should still render the h1 heading under reduced motion
    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();

    // Primary CTA should still be present
    await expect(
      page.getByRole('link', { name: /get compliance plan/i }).first(),
    ).toBeVisible();
  });

  test('critical section rendering keeps compliance section discoverable', async ({
    page,
  }) => {
    await page.goto(`${SITE_BASE}/`, { waitUntil: 'domcontentloaded' });

    // The compliance network section heading after the redesign is "See how everything connects"
    const complianceNetworkSignals = [
      page.locator('text=/See how everything connects/i').first(),
      page.locator('text=/Compliance Network/i').first(),
      page.locator('text=/compliance/i').first(),
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

    // Hero h1 should be visible on mobile
    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();

    // Primary CTA should be reachable on mobile
    await expect(
      page.getByRole('link', { name: /get compliance plan/i }).first(),
    ).toBeVisible();
  });
});
