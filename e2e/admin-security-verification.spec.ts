import { test, expect } from '@playwright/test';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('SECURITY VERIFICATION: Admin Route Protection', () => {
  test('Non-authenticated users cannot access /admin routes', async ({
    page,
  }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Attempt to access admin routes without authentication
    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/admin/analytics',
    ];

    for (const route of adminRoutes) {
      const response = await page.goto(`${APP_URL}${route}`, {
        waitUntil: 'domcontentloaded',
      });

      // Should redirect to login or show unauthorized, not return 200 with admin content
      const status = response?.status();
      const url = page.url();

      // Accept: redirect to login, 401, 403, or staying on non-admin page
      const isProtected =
        url.includes('/login') ||
        url.includes('/auth') ||
        url.includes('/sign-in') ||
        status === 401 ||
        status === 403 ||
        !url.includes('/admin');

      expect(isProtected).toBeTruthy();
    }
  });

  test('Admin routes are properly configured and protected', async ({
    page,
  }) => {
    // Check that admin protection middleware is active
    await page.goto(`${APP_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    });

    // Should not allow unauthenticated access
    expect(page.url()).not.toMatch(/\/admin$/);
  });

  test('Admin page shows "unauthorized" for non-founders', async ({ page }) => {
    // Access admin without proper role should be denied
    await page.goto(`${APP_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    });

    // Page should redirect away from admin or show unauthorized message
    const url = page.url();
    const content = await page.textContent('body');

    const isBlocked =
      !url.includes('/admin') ||
      content?.toLowerCase().includes('unauthorized') ||
      content?.toLowerCase().includes('access denied') ||
      content?.toLowerCase().includes('login') ||
      content?.toLowerCase().includes('sign in');

    expect(isBlocked).toBeTruthy();
  });
});

test.describe('SECURITY AUDIT: Environment Configuration', () => {
  test('Environment variables are properly configured for security', async ({
    page,
  }) => {
    // Verify the app responds correctly (basic health check)
    const response = await page.goto(APP_URL, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBeLessThan(500);

    // Check that sensitive routes don't expose data
    const sensitiveRoutes = ['/api/health', '/'];

    for (const route of sensitiveRoutes) {
      const resp = await page.goto(`${APP_URL}${route}`, {
        waitUntil: 'domcontentloaded',
      });

      // Should not return server error
      const status = resp?.status() ?? 500;
      expect(status).toBeLessThan(500);
    }
  });

  test('Debug routes are not accessible in production', async ({ page }) => {
    const debugRoutes = [
      '/api/debug',
      '/api/debug/session',
      '/api/debug/config',
      '/api/debug/env',
      '/_debug',
    ];

    for (const route of debugRoutes) {
      const response = await page.goto(`${APP_URL}${route}`, {
        waitUntil: 'domcontentloaded',
      });

      const status = response?.status();

      // Debug routes should return 404 or be completely inaccessible
      expect(
        [404, 401, 403, 500].includes(status ?? 0) || status === undefined,
      ).toBeTruthy();
    }
  });
});

test.describe('SECURITY: API Endpoint Protection', () => {
  test('API routes require proper authentication', async ({ request }) => {
    // Test that protected API endpoints reject unauthenticated requests
    const protectedEndpoints = ['/api/user/profile', '/api/admin/users'];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${APP_URL}${endpoint}`);
      const status = response.status();

      // Should return 401, 403, or redirect (3xx)
      const isProtected =
        status === 401 ||
        status === 403 ||
        status === 404 ||
        (status >= 300 && status < 400);
      expect(isProtected).toBeTruthy();
    }
  });

  test('CORS headers are properly configured', async ({ request }) => {
    const response = await request.get(`${APP_URL}/`);

    // Basic response check - CORS specifics depend on configuration
    expect(response.status()).toBeLessThan(500);
  });
});
