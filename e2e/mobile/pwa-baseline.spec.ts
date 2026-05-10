import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone 14'] });

test.describe('PWA foundations — head meta and manifest', () => {
  test('root layout exposes manifest, apple-touch-icon, and apple-web-app meta', async ({
    page,
  }) => {
    await page.goto('/signin', { waitUntil: 'domcontentloaded' });

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(manifestHref).toBe('/manifest.json');

    const appleTouchIcon = await page
      .locator('link[rel="apple-touch-icon"]')
      .first()
      .getAttribute('href');
    expect(appleTouchIcon).toContain('apple-touch-icon');

    const appleCapable = await page
      .locator('meta[name="apple-mobile-web-app-capable"]')
      .getAttribute('content');
    expect(appleCapable).toBe('yes');

    const modernCapable = await page
      .locator('meta[name="mobile-web-app-capable"]')
      .getAttribute('content');
    expect(modernCapable).toBe('yes');

    const appleStatusBar = await page
      .locator('meta[name="apple-mobile-web-app-status-bar-style"]')
      .getAttribute('content');
    expect(appleStatusBar).toBe('black-translucent');

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .getAttribute('content');
    expect(themeColor?.toLowerCase()).toBe('#0f172a');

    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('viewport-fit=cover');
  });

  test('manifest.json declares standalone display and 192/512 maskable icons', async ({
    request,
  }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBe(true);

    const manifest = (await response.json()) as {
      display?: string;
      theme_color?: string;
      background_color?: string;
      icons?: Array<{ sizes: string; purpose?: string; type: string }>;
    };

    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color?.toLowerCase()).toBe('#0f172a');
    expect(manifest.background_color?.toLowerCase()).toBe('#0f172a');

    const sizes = manifest.icons?.map((i) => i.sizes) ?? [];
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));

    const maskable = manifest.icons?.filter((i) =>
      (i.purpose ?? '').includes('maskable'),
    );
    expect(maskable?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  test('iPhone 14 baseline screenshot — /signin gate to /app', async ({
    page,
  }) => {
    await page.goto('/signin', { waitUntil: 'networkidle' });
    await page.screenshot({
      path: 'e2e/screenshots/mobile/baseline-iphone14-signin.jpg',
      type: 'jpeg',
      quality: 70,
    });
  });
});
