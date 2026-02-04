/**
 * FORMAOS NODE & WIRE INTEGRITY TEST
 * Automated Playwright test suite for verifying navigation and CTAs
 *
 * Run with: npx playwright test playwright-node-wire-test.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

const DEFAULT_SITE_BASE =
  process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SITE_BASE =
  process.env.PLAYWRIGHT_SITE_BASE ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  DEFAULT_SITE_BASE;
const APP_BASE =
  process.env.PLAYWRIGHT_APP_BASE ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://app.formaos.com.au';

const siteBaseVariants = (() => {
  try {
    const url = new URL(SITE_BASE);
    const host = url.hostname;
    const normalized = SITE_BASE.replace(/\/$/, '');
    const variants = new Set<string>([normalized]);
    const isLocalhost =
      host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(host);

    if (!isLocalhost) {
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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSiteUrlRegex = (path: string) => {
  const normalizedPath = path === '/' ? '/?' : `${path.replace(/\/$/, '')}/?`;
  const escaped = siteBaseVariants.map(escapeRegex).join('|');
  return new RegExp(`^(${escaped})${normalizedPath}$`);
};

const buildAppUrlRegex = (path: string) => {
  const base = APP_BASE.replace(/\/$/, '');
  const normalizedPath = path === '/' ? '/?' : `${path.replace(/\/$/, '')}/?`;
  return new RegExp(`^${escapeRegex(base)}${normalizedPath}$`);
};

const expectOnSitePath = async (page: Page, path: string) => {
  await expect(page).toHaveURL(buildSiteUrlRegex(path));
};

const expectOnAppPath = async (page: Page, path: string) => {
  await expect(page).toHaveURL(buildAppUrlRegex(path));
};

const isMobileProject = (projectName: string) =>
  projectName.toLowerCase().includes('mobile');

const openMobileMenu = async (page: Page) => {
  const menuButton = page
    .locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
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

const clickNavLink = async (
  page: Page,
  name: string,
  path: string,
  projectName: string,
) => {
  if (isMobileProject(projectName)) {
    const menu = await openMobileMenu(page);
    const link = menu.getByRole('link', { name, exact: true });
    await link.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(buildSiteUrlRegex(path)), link.click()]);
    return;
  }

  const link = page.locator(`nav a[href="${path}"]`).first();
  await link.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(buildSiteUrlRegex(path)),
    link.click({ force: true }),
  ]);
};

const HOME_LOAD_THRESHOLD_MS = process.env.CI ? 3000 : 8000;
const ABOUT_LOAD_THRESHOLD_MS = process.env.CI ? 3000 : 8000;

test.describe('FormaOS Node & Wire Integrity Tests', () => {
  // ============================================================================
  // SECTION 1: PUBLIC WEBSITE NAVIGATION
  // ============================================================================

  test.describe('Public Website Navigation', () => {
    test('should display all navigation links in header', async ({
      page,
    }, testInfo) => {
      await page.goto(SITE_BASE);
      const isMobile = isMobileProject(testInfo.project.name);

      if (isMobile) {
        const menu = await openMobileMenu(page);
        await expect(
          menu.getByRole('link', { name: 'Home', exact: true }),
        ).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'Product', exact: true }),
        ).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'Industries', exact: true }),
        ).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'Security', exact: true }),
        ).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'Pricing', exact: true }),
        ).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'About', exact: true }),
        ).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'Contact', exact: true }),
        ).toBeVisible();
        return;
      }

      // Verify all navigation links are present
      await expect(page.locator('nav a[href="/"]')).toBeVisible();
      await expect(page.locator('nav a[href="/product"]')).toBeVisible();
      await expect(page.locator('nav a[href="/industries"]')).toBeVisible();
      await expect(page.locator('nav a[href="/security"]')).toBeVisible();
      await expect(page.locator('nav a[href="/pricing"]')).toBeVisible();
      await expect(page.locator('nav a[href="/about"]')).toBeVisible(); // NEW
      await expect(page.locator('nav a[href="/contact"]')).toBeVisible();
    });

    test('should navigate to Home page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'Home', '/', testInfo.project.name);
      await expectOnSitePath(page, '/');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to Product page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'Product', '/product', testInfo.project.name);
      await expectOnSitePath(page, '/product');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to Industries page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(
        page,
        'Industries',
        '/industries',
        testInfo.project.name,
      );
      await expectOnSitePath(page, '/industries');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to Security page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'Security', '/security', testInfo.project.name);
      await expectOnSitePath(page, '/security');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to Pricing page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'Pricing', '/pricing', testInfo.project.name);
      await expectOnSitePath(page, '/pricing');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('[NEW] should navigate to About page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'About', '/about', testInfo.project.name);
      await expectOnSitePath(page, '/about');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to Contact page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'Contact', '/contact', testInfo.project.name);
      await expectOnSitePath(page, '/contact');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  });

  // ============================================================================
  // SECTION 2: HEADER CTA BUTTONS
  // ============================================================================

  test.describe('Header CTA Buttons', () => {
    test('should navigate to Login page', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);
      if (isMobileProject(testInfo.project.name)) {
        const menu = await openMobileMenu(page);
        await menu.getByRole('link', { name: /login/i }).click();
      } else {
        await page.click('a[href$="/auth/signin"]');
      }
      await expectOnAppPath(page, '/auth/signin');
    });

    test('should navigate to Pricing from Plans button', async ({
      page,
    }, testInfo) => {
      await page.goto(SITE_BASE);
      await clickNavLink(page, 'Pricing', '/pricing', testInfo.project.name);
      await expectOnSitePath(page, '/pricing');
    });

    test('[UPDATED] should navigate to Signup with plan parameter', async ({
      page,
    }, testInfo) => {
      await page.goto(SITE_BASE);

      if (isMobileProject(testInfo.project.name)) {
        const menu = await openMobileMenu(page);
        await menu.getByRole('link', { name: /start free/i }).click();
      } else {
        // Find and click the "Start Free" button in header
        const startFreeButton = page
          .locator('a[href$="/auth/signup?plan=pro"]')
          .first();
        await startFreeButton.click();
      }

      // Verify URL includes plan parameter
      await expect(page).toHaveURL(
        new RegExp(
          `${escapeRegex(APP_BASE.replace(/\/$/, ''))}/auth/signup\\?plan=pro$`,
        ),
      );

      // Verify plan parameter is in URL
      const url = page.url();
      expect(url).toContain('plan=pro');
    });
  });

  // ============================================================================
  // SECTION 3: HOMEPAGE CTAs
  // ============================================================================

  test.describe('Homepage CTAs', () => {
    test('should have Start Free Trial CTA with plan parameter', async ({
      page,
    }, testInfo) => {
      await page.goto(SITE_BASE);

      if (isMobileProject(testInfo.project.name)) {
        await openMobileMenu(page);
      }

      const startTrialLinks = page.getByRole('link', {
        name: /start free/i,
      });
      const count = await startTrialLinks.count();

      console.log(`Found ${count} start-free CTAs on homepage`);

      expect(count).toBeGreaterThan(0);

      const hrefs = await startTrialLinks.evaluateAll((els) =>
        els.map((el) => el.getAttribute('href') || ''),
      );
      const hasAuthCta = hrefs.some((href) => href.includes('/auth'));
      const hasPlanParam = hrefs.some(
        (href) => href.includes('/auth/signup') && href.includes('plan='),
      );

      expect(hasAuthCta).toBe(true);
      expect(hasPlanParam).toBe(true);
    });

    test('should navigate to Contact from Request Demo', async ({ page }) => {
      await page.goto(SITE_BASE);

      // Find "Request Demo" button
      const requestDemoButton = page
        .getByRole('link', { name: /request demo/i })
        .first();
      await requestDemoButton.scrollIntoViewIfNeeded();
      await expect(requestDemoButton).toBeVisible();
      await requestDemoButton.click({ force: true });

      await expectOnSitePath(page, '/contact');
    });

    test('should navigate to Contact from Schedule Demo', async ({ page }) => {
      await page.goto(SITE_BASE);

      const scheduleDemoLink = page
        .getByRole('link', { name: /schedule demo/i })
        .first();
      await scheduleDemoLink.scrollIntoViewIfNeeded();
      await expect(scheduleDemoLink).toBeVisible();
      await scheduleDemoLink.click({ force: true });

      await expectOnSitePath(page, '/contact');
    });
  });

  // ============================================================================
  // SECTION 4: MOBILE NAVIGATION
  // ============================================================================

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('should open mobile menu and show all links', async ({ page }) => {
      await page.goto(SITE_BASE);

      const menu = await openMobileMenu(page);

      // Verify all links are visible in mobile menu
      await expect(menu.getByText('Home', { exact: true })).toBeVisible();
      await expect(menu.getByText('Product', { exact: true })).toBeVisible();
      await expect(menu.getByText('Industries', { exact: true })).toBeVisible();
      await expect(menu.getByText('Security', { exact: true })).toBeVisible();
      await expect(menu.getByText('Pricing', { exact: true })).toBeVisible();
      await expect(menu.getByText('About', { exact: true })).toBeVisible(); // NEW
      await expect(menu.getByText('Contact', { exact: true })).toBeVisible();
    });

    test('[NEW] should navigate to About from mobile menu', async ({
      page,
    }) => {
      await page.goto(SITE_BASE);

      const menu = await openMobileMenu(page);

      // Click About link
      const aboutLink = menu.getByText('About', { exact: true });
      await aboutLink.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForURL(buildSiteUrlRegex('/about')),
        aboutLink.click(),
      ]);

      // Verify navigation
      await expectOnSitePath(page, '/about');
    });
  });

  // ============================================================================
  // SECTION 5: MIDDLEWARE REDIRECTS
  // ============================================================================

  test.describe('Middleware Redirects', () => {
    test('should redirect /auth to /auth/signin', async ({ page }) => {
      await page.goto(APP_BASE + '/auth');
      await expectOnAppPath(page, '/auth/signin');
    });

    test('should redirect OAuth code at root to callback', async ({
      page,
      request,
    }) => {
      const response = await request.get(`${SITE_BASE}/?code=test&state=test`, {
        maxRedirects: 0,
      });
      expect([307, 308]).toContain(response.status());
      expect(response.headers().location).toContain('/auth/callback');

      await page.goto(`${SITE_BASE}/?code=test&state=test`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForURL('**/auth/signin');
    });

    test('should redirect unauthenticated /app to signin', async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      await page.goto(APP_BASE + '/app');
      await expectOnAppPath(page, '/auth/signin');
    });

    test('should redirect unauthenticated /admin to signin', async ({
      page,
    }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      await page.goto(APP_BASE + '/admin');
      await expectOnAppPath(page, '/auth/signin');
    });
  });

  // ============================================================================
  // SECTION 6: ERROR PAGES
  // ============================================================================

  test.describe('Error Pages', () => {
    test('should display 404 page for non-existent route', async ({ page }) => {
      await page.goto(SITE_BASE + '/this-page-does-not-exist');

      // Verify 404 content (adjust selector based on your 404 page)
      await expect(page.locator('text=/404|not found/i')).toBeVisible();
    });

    test('should display unauthorized page', async ({ page }) => {
      await page.goto(APP_BASE + '/unauthorized');

      // Verify unauthorized content
      await expect(
        page.locator('text=/unauthorized|access denied/i').first(),
      ).toBeVisible();
    });
  });

  // ============================================================================
  // SECTION 7: PAGE LOAD PERFORMANCE
  // ============================================================================

  test.describe('Page Load Performance', () => {
    test('should load homepage within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(SITE_BASE);
      const loadTime = Date.now() - startTime;

      console.log(`Homepage loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(HOME_LOAD_THRESHOLD_MS);
    });

    test('should load About page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(SITE_BASE + '/about');
      const loadTime = Date.now() - startTime;

      console.log(`About page loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(ABOUT_LOAD_THRESHOLD_MS);
    });
  });

  // ============================================================================
  // SECTION 8: CONSOLE ERRORS
  // ============================================================================

  test.describe('Console Error Detection', () => {
    test('should not have console errors on homepage', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(SITE_BASE);
      await page.waitForTimeout(2000); // Wait for any async errors

      const ignorePatterns = [
        /favicon/i,
        /Failed to load resource/i,
        /Download the React DevTools/i,
        /Hydration/i,
      ];
      const relevant = errors.filter(
        (msg) => !ignorePatterns.some((pattern) => pattern.test(msg)),
      );

      console.log('Console errors found:', errors);
      console.log('Relevant console errors:', relevant);
      expect(relevant.length).toBe(0);
    });

    test('should not have console errors on About page', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(SITE_BASE + '/about');
      await page.waitForTimeout(2000);

      console.log('Console errors found:', errors);
      expect(errors.length).toBe(0);
    });
  });

  // ============================================================================
  // SECTION 9: ACCESSIBILITY CHECKS
  // ============================================================================

  test.describe('Basic Accessibility', () => {
    test('should have proper page titles', async ({ page }) => {
      await page.goto(SITE_BASE);
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should have accessible navigation', async ({ page }, testInfo) => {
      await page.goto(SITE_BASE);

      if (isMobileProject(testInfo.project.name)) {
        const menu = await openMobileMenu(page);
        const links = menu.locator('a[href]');
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
        return;
      }

      // Check for nav element
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Check for links with proper href attributes
      const links = page.locator('nav a[href]');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// AUTHENTICATED USER TESTS (Requires login)
// ============================================================================

test.describe('Authenticated User Tests', () => {
  // Note: These tests require actual authentication
  // You'll need to implement login helper or use stored auth state

  test.skip('should access app dashboard when authenticated', async ({
    page,
  }) => {
    // TODO: Implement authentication
    // await loginAsRegularUser(page);

    await page.goto(APP_BASE + '/app');
    await expectOnAppPath(page, '/app');
  });

  test.skip('should redirect to /admin for founder users', async ({ page }) => {
    // TODO: Implement founder authentication
    // await loginAsFounder(page);

    await page.goto(APP_BASE + '/auth/signin');
    await expectOnAppPath(page, '/admin');
  });
});
