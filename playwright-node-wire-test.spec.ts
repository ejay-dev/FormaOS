/**
 * FORMAOS NODE & WIRE INTEGRITY TEST
 * Automated Playwright test suite for verifying navigation and CTAs
 *
 * Run with: npx playwright test playwright-node-wire-test.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('FormaOS Node & Wire Integrity Tests', () => {
  // ============================================================================
  // SECTION 1: PUBLIC WEBSITE NAVIGATION
  // ============================================================================

  test.describe('Public Website Navigation', () => {
    test('should display all navigation links in header', async ({ page }) => {
      await page.goto(BASE_URL);

      // Verify all navigation links are present
      await expect(page.locator('nav a[href="/"]')).toBeVisible();
      await expect(page.locator('nav a[href="/product"]')).toBeVisible();
      await expect(page.locator('nav a[href="/industries"]')).toBeVisible();
      await expect(page.locator('nav a[href="/security"]')).toBeVisible();
      await expect(page.locator('nav a[href="/pricing"]')).toBeVisible();
      await expect(page.locator('nav a[href="/about"]')).toBeVisible(); // NEW
      await expect(page.locator('nav a[href="/contact"]')).toBeVisible();
    });

    test('should navigate to Home page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/"]');
      await expect(page).toHaveURL(BASE_URL + '/');
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should navigate to Product page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/product"]');
      await expect(page).toHaveURL(BASE_URL + '/product');
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should navigate to Industries page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/industries"]');
      await expect(page).toHaveURL(BASE_URL + '/industries');
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should navigate to Security page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/security"]');
      await expect(page).toHaveURL(BASE_URL + '/security');
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should navigate to Pricing page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/pricing"]');
      await expect(page).toHaveURL(BASE_URL + '/pricing');
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('[NEW] should navigate to About page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/about"]');
      await expect(page).toHaveURL(BASE_URL + '/about');
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should navigate to Contact page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav a[href="/contact"]');
      await expect(page).toHaveURL(BASE_URL + '/contact');
      await expect(page.locator('h1, h2')).toBeVisible();
    });
  });

  // ============================================================================
  // SECTION 2: HEADER CTA BUTTONS
  // ============================================================================

  test.describe('Header CTA Buttons', () => {
    test('should navigate to Login page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('a[href="/auth/signin"]');
      await expect(page).toHaveURL(BASE_URL + '/auth/signin');
    });

    test('should navigate to Pricing from Plans button', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('a[href="/pricing"]');
      await expect(page).toHaveURL(BASE_URL + '/pricing');
    });

    test('[UPDATED] should navigate to Signup with plan parameter', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      // Find and click the "Start Free" button in header
      const startFreeButton = page
        .locator('a[href="/auth/signup?plan=pro"]')
        .first();
      await startFreeButton.click();

      // Verify URL includes plan parameter
      await expect(page).toHaveURL(BASE_URL + '/auth/signup?plan=pro');

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
    }) => {
      await page.goto(BASE_URL);

      // Find all "Start Free Trial" links
      const startTrialLinks = page.locator('a[href*="/auth/signup"]');
      const count = await startTrialLinks.count();

      console.log(`Found ${count} signup CTAs on homepage`);

      // Verify at least one has plan parameter
      const linksWithPlan = page.locator('a[href="/auth/signup?plan=pro"]');
      const planCount = await linksWithPlan.count();

      expect(planCount).toBeGreaterThan(0);
    });

    test('should navigate to Contact from Request Demo', async ({ page }) => {
      await page.goto(BASE_URL);

      // Find "Request Demo" button
      const requestDemoButton = page.locator('a[href="/contact"]').first();
      await requestDemoButton.click();

      await expect(page).toHaveURL(BASE_URL + '/contact');
    });

    test('should navigate to Product from Explore Platform', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      // Find "Explore Platform Architecture" link
      const exploreLink = page.locator('a[href="/product"]').first();
      await exploreLink.click();

      await expect(page).toHaveURL(BASE_URL + '/product');
    });
  });

  // ============================================================================
  // SECTION 4: MOBILE NAVIGATION
  // ============================================================================

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('should open mobile menu and show all links', async ({ page }) => {
      await page.goto(BASE_URL);

      // Click hamburger menu
      const menuButton = page
        .locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
        .first();
      await menuButton.click();

      // Wait for menu to open
      await page.waitForTimeout(500);

      // Verify all links are visible in mobile menu
      await expect(page.locator('text=Home')).toBeVisible();
      await expect(page.locator('text=Product')).toBeVisible();
      await expect(page.locator('text=Industries')).toBeVisible();
      await expect(page.locator('text=Security')).toBeVisible();
      await expect(page.locator('text=Pricing')).toBeVisible();
      await expect(page.locator('text=About')).toBeVisible(); // NEW
      await expect(page.locator('text=Contact')).toBeVisible();
    });

    test('[NEW] should navigate to About from mobile menu', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      // Open mobile menu
      const menuButton = page
        .locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
        .first();
      await menuButton.click();
      await page.waitForTimeout(500);

      // Click About link
      await page.click('text=About');

      // Verify navigation
      await expect(page).toHaveURL(BASE_URL + '/about');
    });
  });

  // ============================================================================
  // SECTION 5: MIDDLEWARE REDIRECTS
  // ============================================================================

  test.describe('Middleware Redirects', () => {
    test('should redirect /auth to /auth/signin', async ({ page }) => {
      await page.goto(BASE_URL + '/auth');
      await expect(page).toHaveURL(BASE_URL + '/auth/signin');
    });

    test('should redirect OAuth code at root to callback', async ({ page }) => {
      await page.goto(BASE_URL + '/?code=test&state=test');
      await expect(page).toHaveURL(
        BASE_URL + '/auth/callback?code=test&state=test',
      );
    });

    test('should redirect unauthenticated /app to signin', async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      await page.goto(BASE_URL + '/app');
      await expect(page).toHaveURL(BASE_URL + '/auth/signin');
    });

    test('should redirect unauthenticated /admin to signin', async ({
      page,
    }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      await page.goto(BASE_URL + '/admin');
      await expect(page).toHaveURL(BASE_URL + '/auth/signin');
    });
  });

  // ============================================================================
  // SECTION 6: ERROR PAGES
  // ============================================================================

  test.describe('Error Pages', () => {
    test('should display 404 page for non-existent route', async ({ page }) => {
      await page.goto(BASE_URL + '/this-page-does-not-exist');

      // Verify 404 content (adjust selector based on your 404 page)
      await expect(page.locator('text=/404|not found/i')).toBeVisible();
    });

    test('should display unauthorized page', async ({ page }) => {
      await page.goto(BASE_URL + '/unauthorized');

      // Verify unauthorized content
      await expect(
        page.locator('text=/unauthorized|access denied/i'),
      ).toBeVisible();
    });
  });

  // ============================================================================
  // SECTION 7: PAGE LOAD PERFORMANCE
  // ============================================================================

  test.describe('Page Load Performance', () => {
    test('should load homepage within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      const loadTime = Date.now() - startTime;

      console.log(`Homepage loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load About page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL + '/about');
      const loadTime = Date.now() - startTime;

      console.log(`About page loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
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

      await page.goto(BASE_URL);
      await page.waitForTimeout(2000); // Wait for any async errors

      console.log('Console errors found:', errors);
      expect(errors.length).toBe(0);
    });

    test('should not have console errors on About page', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(BASE_URL + '/about');
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
      await page.goto(BASE_URL);
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should have accessible navigation', async ({ page }) => {
      await page.goto(BASE_URL);

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

    await page.goto(BASE_URL + '/app');
    await expect(page).toHaveURL(BASE_URL + '/app');
  });

  test.skip('should redirect to /admin for founder users', async ({ page }) => {
    // TODO: Implement founder authentication
    // await loginAsFounder(page);

    await page.goto(BASE_URL + '/auth/signin');
    await expect(page).toHaveURL(BASE_URL + '/admin');
  });
});
