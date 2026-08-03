import { test, expect } from '@playwright/test';

/**
 * Security verification tests for admin route protection.
 * These tests verify that unauthenticated users cannot access admin routes
 * and that security headers/configurations are properly set.
 *
 * Uses baseURL from playwright.config.ts (PLAYWRIGHT_BASE_URL || localhost:3000)
 */

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
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
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
    await page.goto('/admin', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Should not allow unauthenticated access
    expect(page.url()).not.toMatch(/\/admin$/);
  });

  test('Admin page shows "unauthorized" for non-founders', async ({ page }) => {
    // 2026-08-02: `isBlocked` used to accept any page whose body contained
    // "login" or "sign in" anywhere. A fully rendered admin console carries
    // those strings in its nav/footer, so an authorization leak passed. The
    // real contract (proxy.ts, "STEP 2: GATE /admin AT THE EDGE") is that an
    // unauthenticated /admin request is redirected to /unauthorized — assert
    // the destination and assert the admin surface did not render.
    await page.context().clearCookies();
    await page.goto('/admin', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await expect(page).toHaveURL(/\/(unauthorized|auth\/signin)(\?|$)/);

    const content = (await page.textContent('body')) ?? '';
    expect(content).toMatch(/Access Denied|Unauthorized Access|Sign in/i);

    // Admin console surface must be absent — this heading only exists on the
    // real /admin/dashboard page (see e2e/admin-founder-smoke.spec.ts).
    expect(content).not.toContain('Platform Overview');
  });
});

test.describe('SECURITY AUDIT: Environment Configuration', () => {
  test('Environment variables are properly configured for security', async ({
    page,
  }) => {
    // Verify the app responds correctly (basic health check)
    const response = await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // v4-031: `toBeLessThan(500)` accepted anything ≤499 including 4xx.
    // Marketing root and /api/health should return 200 or a redirect.
    // 2026-05-25: include 304 (Not Modified) — Codex's audit caught the
// browser legitimately returning a conditional-GET 304 for the cached
// root response on warm runs, which the original assertion rejected.
expect([200, 301, 302, 304, 307, 308]).toContain(response?.status() ?? 0);

    const sensitiveRoutes = ['/api/health', '/'];

    for (const route of sensitiveRoutes) {
      const resp = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      const status = resp?.status() ?? 0;
      expect(
        [200, 301, 302, 304, 307, 308],
        `${route} should return 200 / 304 / redirect`,
      ).toContain(status);
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
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const status = response?.status() ?? 0;

      // 2026-08-02: 500 (and a missing response) used to count as a pass,
      // which hid a debug route that crashes *after* executing server code.
      // app/api/debug/_guard.ts returns 404 for every debug route outside
      // NODE_ENV=development and for non-founders, so 404 is the contract.
      expect(
        [401, 403, 404],
        `${route} must be inaccessible (got ${status})`,
      ).toContain(status);

      // A guard that returns the right status but still serialises config is
      // the other half of the regression — assert nothing leaked.
      const body = (await response?.text()) ?? '';
      expect(body).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(body).not.toContain('hasServiceRoleKey');
      expect(body).not.toContain('cookieDomain');
    }
  });
});

test.describe('SECURITY: API Endpoint Protection', () => {
  test('API routes require proper authentication', async ({ request }) => {
    // Test that protected API endpoints reject unauthenticated requests
    const protectedEndpoints = ['/api/user/profile', '/api/admin/users'];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
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
    // 2026-08-02: this test used to assert only `status < 500` and never read
    // a single header, so a wide-open `Access-Control-Allow-Origin: *` passed.
    // FormaOS is same-origin only — next.config.ts `headers()` and proxy.ts
    // deliberately set no CORS allow-origin at all.
    const response = await request.get('/');
    expect(response.status()).toBeLessThan(400);

    const headers = response.headers();

    const allowOrigin = headers['access-control-allow-origin'] ?? '';
    expect(
      allowOrigin,
      'Marketing/app root must not advertise a wildcard CORS origin',
    ).not.toBe('*');
    expect(headers['access-control-allow-credentials'] ?? '').not.toBe('true');

    // Same-origin companions set unconditionally in next.config.ts headers()
    // and re-set in proxy.ts step 6.
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
