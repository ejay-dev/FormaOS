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
  { name: 'Docs', path: '/documentation' },
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
  return new RegExp(`^(${escaped})${normalizedPath}`);
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
  test('header CTAs route correctly on all marketing pages', async ({
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

      const compliancePlanLink = scope
        .getByRole('link', { name: /get compliance plan/i })
        .first();
      await expect(compliancePlanLink).toBeVisible();
      const compliancePlanHref = normalizeHref(
        await compliancePlanLink.getAttribute('href'),
      );
      expect(compliancePlanHref).toContain('/contact');
      expect(compliancePlanHref).toContain('type=compliance-plan');

      if (useMobileMenu) {
        await page.keyboard.press('Escape').catch(() => null);
      }
    }
  });

  test('homepage primary CTAs route to guided buying flows', async ({
    page,
  }) => {
    await page.goto(SITE_BASE, { waitUntil: 'load' });

    const compliancePlanCta = page
      .getByRole('link', { name: /get compliance plan/i })
      .first();
    await expect(compliancePlanCta).toBeVisible();
    const compliancePlanUrl = normalizeHref(
      await compliancePlanCta.getAttribute('href'),
    );
    expect(compliancePlanUrl).toContain('/contact');
    expect(compliancePlanUrl).toContain('type=compliance-plan');

    const bookDemoCta = page.getByRole('link', { name: /book demo/i }).first();
    await expect(bookDemoCta).toBeVisible();
    const bookDemoUrl = normalizeHref(await bookDemoCta.getAttribute('href'));
    expect(bookDemoUrl).toContain('/contact');
    expect(bookDemoUrl).toContain('type=demo');
  });

  test('pricing plan actions route to the correct buying motion', async ({
    page,
  }) => {
    await page.goto(`${SITE_BASE}/pricing`, { waitUntil: 'domcontentloaded' });

    // Foundation: public self-serve via signup handshake, auto-redirects into
    // Stripe Checkout after org bootstrap. Href is relative on the pricing
    // page (same-origin /auth/signup) — resolves to site base in prod and
    // local dev alike. We only assert the handshake query shape, not a
    // specific absolute origin.
    const foundationCta = page
      .getByRole('link', { name: /start assessment/i })
      .first();
    await expect(foundationCta).toBeVisible();
    const foundationHref = normalizeHref(
      await foundationCta.getAttribute('href'),
    );
    expect(foundationHref).toContain('/auth/signup');
    expect(foundationHref).toContain('plan=basic');
    expect(foundationHref).toContain('intent=checkout');
    expect(foundationHref).toContain('source=pricing');

    // Growth: self-serve via signup handshake, same as Foundation.
    const growthCta = page
      .getByRole('link', { name: /start growth plan/i })
      .first();
    await expect(growthCta).toBeVisible();
    const growthHref = normalizeHref(await growthCta.getAttribute('href'));
    expect(growthHref).toContain('/auth/signup');
    expect(growthHref).toContain('plan=pro');
    expect(growthHref).toContain('intent=checkout');

    // Enterprise: procurement-led through Book Demo.
    const enterpriseCta = page
      .getByRole('link', { name: /book demo/i })
      .first();
    await expect(enterpriseCta).toBeVisible();
    const enterpriseHref = normalizeHref(
      await enterpriseCta.getAttribute('href'),
    );
    expect(enterpriseHref).toContain('/contact');
    expect(enterpriseHref).toContain('type=enterprise');
  });

  test('pricing page surfaces no free-trial language', async ({ page }) => {
    await page.goto(`${SITE_BASE}/pricing`, { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/start free trial/i);
    expect(body).not.toMatch(/14[- ]day free trial/i);
    expect(body).not.toMatch(/no credit card required/i);
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

    // Route smoke test for one CTA link so the anchor regex stays exercised.
    const firstContactLink = page.locator('footer a[href*="/contact"]').first();
    if (await firstContactLink.count()) {
      const href = normalizeHref(await firstContactLink.getAttribute('href'));
      expect(href).toMatch(buildSiteUrlRegex('/contact'));
    }
  });
});
