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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const siteBaseVariants = (() => {
  try {
    const url = new URL(SITE_BASE);
    const host = url.hostname;
    const normalized = SITE_BASE.replace(/\/$/, '');
    const variants = new Set<string>([normalized]);

    if (!host.includes('localhost')) {
      if (host.startsWith('www.')) {
        const withoutWww = new URL(url.toString());
        withoutWww.hostname = host.replace(/^www\./, '');
        variants.add(withoutWww.toString().replace(/\/$/, ''));
      } else {
        const withWww = new URL(url.toString());
        withWww.hostname = `www.${host}`;
        variants.add(withWww.toString().replace(/\/$/, ''));
      }
    }

    return Array.from(variants);
  } catch {
    return [SITE_BASE.replace(/\/$/, '')];
  }
})();

const buildSiteUrlRegex = (path: string) => {
  const normalizedPath = path === '/' ? '/?' : `${path.replace(/\/$/, '')}/?`;
  const escaped = siteBaseVariants.map(escapeRegex).join('|');
  return new RegExp(`^(${escaped})${normalizedPath}$`);
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
    await page.goto(SITE_BASE, { waitUntil: 'load' });

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
      page.waitForURL(buildSiteUrlRegex('/contact'), {
        waitUntil: 'domcontentloaded',
      }),
      requestDemo.click(),
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
