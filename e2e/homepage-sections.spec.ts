/**
 * Homepage Sections Smoke Test
 * Verifies key marketing sections render and are visible
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Sections', () => {
  test('renders all critical sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Hero section
    await expect(page.locator('h1').first()).toBeVisible();

    // ScrollShowcase section
    const showcase = page.locator('[data-testid="scroll-showcase"]');
    await expect(showcase).toBeVisible({ timeout: 10000 });

    // Verify section header content
    await expect(
      page.locator('text=/See FormaOS in Action/i').first(),
    ).toBeVisible();

    // Verify at least one screenshot image loaded
    const screenshotImage = showcase.locator('img').first();
    await expect(screenshotImage).toBeVisible();
  });

  test('ScrollShowcase scenes are present on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const showcase = page.locator('[data-testid="scroll-showcase"]');
    await showcase.scrollIntoViewIfNeeded();
    await expect(showcase).toBeVisible({ timeout: 10000 });

    // Images should be visible on mobile (stacked layout)
    const mobileImage = showcase.locator('img').first();
    await expect(mobileImage).toBeVisible();
  });

  test('ScrollShowcase renders with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Component should still render in static fallback mode
    const showcase = page.locator('[data-testid="scroll-showcase"]');
    await expect(showcase).toBeVisible({ timeout: 10000 });

    // Static layout should show all scene titles
    await expect(
      showcase.locator('text=/Command Center Overview/i').first(),
    ).toBeVisible();
    await expect(
      showcase.locator('text=/Evidence Vault/i').first(),
    ).toBeVisible();
  });
});
