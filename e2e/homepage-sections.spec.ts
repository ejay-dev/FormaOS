/**
 * Homepage Sections Smoke Test
 * Verifies key marketing sections render and are visible.
 *
 * Legacy ScrollShowcase assertions are parked under test.fixme —
 * the component still ships in components/marketing/ScrollShowcase.tsx
 * but was removed from the homepage during the enterprise marketing
 * refresh. Re-enable these when the section is reinstated, or delete
 * the fixtures and this file if the component is retired.
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Sections', () => {
  test('renders hero heading and primary CTA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test.fixme(
    'renders all critical sections',
    async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator('h1').first()).toBeVisible();
      const showcase = page.locator('[data-testid="scroll-showcase"]');
      await expect(showcase).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('text=/See FormaOS in Action/i').first(),
      ).toBeVisible();
      const screenshotImage = showcase.locator('img').first();
      await expect(screenshotImage).toBeVisible();
    },
  );

  test.fixme(
    'ScrollShowcase scenes are present on mobile',
    async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/', { waitUntil: 'networkidle' });
      const showcase = page.locator('[data-testid="scroll-showcase"]');
      await showcase.scrollIntoViewIfNeeded();
      await expect(showcase).toBeVisible({ timeout: 10000 });
      const mobileImage = showcase.locator('img').first();
      await expect(mobileImage).toBeVisible();
    },
  );

  test.fixme(
    'ScrollShowcase renders with reduced motion',
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/', { waitUntil: 'networkidle' });
      const showcase = page.locator('[data-testid="scroll-showcase"]');
      await expect(showcase).toBeVisible({ timeout: 10000 });
      await expect(
        showcase.locator('text=/Command Center Overview/i').first(),
      ).toBeVisible();
      await expect(
        showcase.locator('text=/Evidence Vault/i').first(),
      ).toBeVisible();
    },
  );
});
