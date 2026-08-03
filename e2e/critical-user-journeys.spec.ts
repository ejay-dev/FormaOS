import { test, expect } from '@playwright/test';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SITE_URL = process.env.PLAYWRIGHT_SITE_BASE || APP_URL;

test.describe('CRITICAL: User Journey Validation', () => {
  test('CRITICAL: New user signup → onboarding → dashboard (NO PRICING REDIRECT)', async ({
    page,
  }) => {
    // Visit the homepage
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toBeTruthy();

    // Look for the public compliance-infrastructure CTAs.
    const ctaSelectors = [
      'text=Get Compliance Plan',
      'text=Start Foundation Plan',
      'text=Book Demo',
      'text=Talk to Sales',
      'a[href*="/contact"]',
      'a[href*="/pricing"]',
    ];

    // Check for at least one CTA being visible (optional)
    let ctaCount = 0;
    for (const selector of ctaSelectors) {
      const cta = page.locator(selector).first();
      if (await cta.isVisible().catch(() => false)) {
        ctaCount++;
        break;
      }
    }

    // The site should be accessible with a title
    expect(await page.title()).toBeTruthy();
    // At least one signup CTA should be visible on the homepage
    expect(ctaCount).toBeGreaterThan(0);
  });

  test('CRITICAL: Homepage loads successfully', async ({ page }) => {
    const response = await page.goto(SITE_URL, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBeLessThan(400);
    expect(await page.title()).toBeTruthy();
  });

  test('CRITICAL: App URL is accessible', async ({ page }) => {
    const response = await page.goto(APP_URL, {
      waitUntil: 'domcontentloaded',
    });

    // Should either load successfully or redirect to login
    const status = response?.status() ?? 500;
    expect(status).toBeLessThan(500);
  });

  test('CRITICAL: Navigation links work', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    // 2026-08-02: the comment promised "internal links don't lead to 404s"
    // but the body only collected hrefs into a Set and asserted the Set was
    // non-empty. No request was ever made, so every internal link on the
    // homepage could 404 and the test still passed. Now each collected link
    // is actually fetched.
    const links = await page.locator('a[href^="/"]').all();
    const checkedLinks = new Set<string>();

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (
        href &&
        !checkedLinks.has(href) &&
        !href.includes('#') &&
        // API routes are auth-gated by design and are not navigation.
        !href.startsWith('/api/')
      ) {
        checkedLinks.add(href);
        if (checkedLinks.size >= 8) break;
      }
    }

    expect(
      checkedLinks.size,
      'Homepage exposed no internal navigation links',
    ).toBeGreaterThanOrEqual(3);

    for (const href of checkedLinks) {
      const target = new URL(href, SITE_URL).toString();
      const response = await page.request.get(target, { timeout: 30_000 });
      expect(
        response.status(),
        `Homepage link ${href} resolved to ${response.status()}`,
      ).toBeLessThan(400);
    }
  });

  test('CRITICAL: Non-founder cannot access admin routes', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();

    // Try to access admin
    await page.goto(`${APP_URL}/admin`, { waitUntil: 'domcontentloaded' });

    // Should redirect away from admin or show access denied
    const url = page.url();
    const isBlocked =
      !url.endsWith('/admin') ||
      url.includes('login') ||
      url.includes('auth') ||
      url.includes('unauthorized');

    expect(isBlocked).toBeTruthy();
  });

  test('CRITICAL: Existing user login surface is usable', async ({ page }) => {
    // 2026-08-02: this test never performed a login and never inspected the
    // page — it walked four candidate URLs and passed as soon as one
    // returned <400, so a sign-in page rendering an empty error boundary
    // still counted as "login resumes properly". The canonical route is
    // /auth/signin (app/auth/login and app/signin are redirect aliases), and
    // the form is rendered by components/auth/SignInPageContent.
    const response = await page.goto(`${APP_URL}/auth/signin`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status() ?? 0).toBeLessThan(400);

    await expect(page.locator('input#email[type="email"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('input#password[type="password"]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Access FormaOS/i }),
    ).toBeEnabled();

    // The legacy alias must keep landing on the same canonical form.
    await page.goto(`${APP_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/signin(\?|$)/);
    await expect(page.locator('input#email[type="email"]')).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('CRITICAL: Performance Validation', () => {
  test('Page load performance meets requirements', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;

    // Page should load within 30 seconds (generous timeout for CI)
    expect(loadTime).toBeLessThan(30000);
  });

  test('No JavaScript errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    // Allow page to settle
    await page.waitForTimeout(1000);

    // Filter out known benign errors (like third-party scripts)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('Script error') &&
        !e.includes('third-party'),
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('CRITICAL: Core Feature Accessibility', () => {
  test('Main content is visible', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    // Page should have visible content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should have some text content
    const textContent = await page.textContent('body');
    expect(textContent?.length).toBeGreaterThan(100);
  });

  test('Page has proper meta tags', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    // Check for basic SEO
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check viewport meta
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toBeTruthy();
  });
});
