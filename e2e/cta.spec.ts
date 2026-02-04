import { test, expect } from '@playwright/test';

const SITE_BASE =
  process.env.PLAYWRIGHT_SITE_BASE ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://localhost:3000';
const APP_BASE = (
  process.env.PLAYWRIGHT_APP_BASE ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://app.formaos.com.au'
).replace(/\/$/, '');

const marketingPages = [
  { name: 'Home', path: '/' },
  { name: 'Product', path: '/product' },
  { name: 'Industries', path: '/industries' },
  { name: 'Security', path: '/security' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Story', path: '/our-story' },
  { name: 'Contact', path: '/contact' },
  { name: 'Docs', path: '/docs' },
  { name: 'Blog', path: '/blog' },
  { name: 'FAQ', path: '/faq' },
];

const normalizeHref = (href: string | null) => {
  if (!href) return '';
  try {
    return new URL(href, SITE_BASE).toString();
  } catch {
    return href;
  }
};

const isMobileProject = (projectName: string) =>
  projectName.toLowerCase().includes('mobile');

const openMobileMenu = async (page: import('@playwright/test').Page) => {
  const menuButton = page
    .locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]')
    .first();
  await menuButton.waitFor({ state: 'visible' });
  await menuButton.scrollIntoViewIfNeeded();
  await menuButton.click({ force: true });
  const menu = page.locator('#mobile-menu');
  try {
    await menu.waitFor({ state: 'visible', timeout: 10000 });
  } catch {
    await menuButton.click({ force: true });
    await menu.waitFor({ state: 'visible', timeout: 10000 });
  }
  return menu;
};

test.describe('Marketing CTA wiring', () => {
  test('header CTAs route to app domain on all marketing pages', async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    const useMobileMenu = isMobileProject(testInfo.project.name);

    for (const target of marketingPages) {
      await page.goto(`${SITE_BASE}${target.path}`, {
        waitUntil: 'domcontentloaded',
      });

      const scope = useMobileMenu ? await openMobileMenu(page) : page;
      const loginLink = scope.getByRole('link', { name: /login/i }).first();
      await expect(loginLink).toBeVisible();
      const loginHref = normalizeHref(await loginLink.getAttribute('href'));
      expect(loginHref).toContain(`${APP_BASE}/auth/signin`);

      const startFreeLink = scope
        .getByRole('link', { name: /start free/i })
        .first();
      await expect(startFreeLink).toBeVisible();
      const startHref = normalizeHref(await startFreeLink.getAttribute('href'));
      expect(startHref.startsWith(APP_BASE)).toBe(true);

      if (useMobileMenu) {
        await page.keyboard.press('Escape').catch(() => null);
      }
    }
  });

  test('homepage primary CTAs route correctly', async ({ page }) => {
    await page.goto(SITE_BASE, { waitUntil: 'domcontentloaded' });

    const startTrial = page
      .getByRole('link', { name: /start free trial/i })
      .first();
    await expect(startTrial).toBeVisible();
    const startHref = normalizeHref(await startTrial.getAttribute('href'));
    expect(startHref.startsWith(APP_BASE)).toBe(true);

    const requestDemo = page
      .getByRole('link', { name: /request demo/i })
      .first();
    await requestDemo.scrollIntoViewIfNeeded();
    await expect(requestDemo).toBeVisible();
    await Promise.all([
      page.waitForURL(new RegExp(`${SITE_BASE}/contact/?$`)),
      requestDemo.click({ force: true }),
    ]);
  });

  test('pricing plan actions route to app or contact', async ({ page }) => {
    await page.goto(`${SITE_BASE}/pricing`, { waitUntil: 'domcontentloaded' });

    const startTrialLinks = page.getByRole('link', {
      name: /start free trial/i,
    });
    const trialCount = await startTrialLinks.count();
    expect(trialCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(trialCount, 3); i++) {
      const href = normalizeHref(
        await startTrialLinks.nth(i).getAttribute('href'),
      );
      expect(href.startsWith(APP_BASE)).toBe(true);
      expect(href).toContain('/auth');
    }

    const contactSales = page.getByRole('link', { name: /contact sales/i });
    if (await contactSales.count()) {
      const href = normalizeHref(await contactSales.first().getAttribute('href'));
      expect(href).toContain(`${SITE_BASE}/contact`);
    }
  });

  test('footer links are present and non-empty', async ({ page }) => {
    await page.goto(SITE_BASE, { waitUntil: 'domcontentloaded' });

    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(5);

    for (let i = 0; i < Math.min(count, 20); i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(String(href).trim()).not.toBe('#');
    }
  });
});
