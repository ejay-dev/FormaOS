import { test, expect } from '@playwright/test';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

/**
 * Google OAuth Smoke Tests
 *
 * These tests verify the OAuth flow is correctly wired WITHOUT completing
 * the actual Google sign-in (which requires real credentials).
 *
 * What we validate:
 *  1. Sign-in pages render a Google button using signInWithOAuth (not GIS)
 *  2. Clicking Google button redirects to Supabase's Google OAuth endpoint
 *  3. The redirect ultimately targets accounts.google.com (not blocked / 401)
 *  4. No Google Identity Services (GIS) scripts are loaded
 *  5. Callback route handles missing code gracefully (no crash / loop)
 *
 * If any of these fail, the OAuth pipeline is broken and must be fixed
 * before deployment.
 */
test.describe('Google OAuth Smoke Tests', () => {
  const authPages = [
    { name: 'signin', path: '/signin' },
    { name: 'login', path: '/auth/login' },
    { name: 'signup', path: '/auth/signup' },
  ];

  for (const { name, path } of authPages) {
    test(`${name} page — Google button exists and triggers OAuth redirect`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      // ── 1. Google sign-in button must be visible ──
      const googleBtn = page.locator(
        'button:has-text("Google"), button:has-text("google"), [data-testid="google-signin-btn"]',
      );
      await expect(googleBtn.first()).toBeVisible({ timeout: 10_000 });

      // ── 2. No Google Identity Services script should be loaded ──
      const gisScripts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('script')).filter((s) =>
          s.src.includes('accounts.google.com/gsi/client'),
        ),
      );
      expect(gisScripts.length).toBe(0);

      // ── 3. Clicking the button should redirect to Supabase OAuth → Google ──
      // We intercept navigation rather than following it (we can't complete Google login in E2E)
      const [request] = await Promise.all([
        page.waitForRequest(
          (req) => {
            const url = req.url();
            return (
              url.includes('supabase.co/auth/v1/authorize') ||
              url.includes('accounts.google.com/o/oauth2')
            );
          },
          { timeout: 15_000 },
        ),
        googleBtn.first().click(),
      ]);

      const redirectUrl = request.url();

      // Must go through Supabase authorize endpoint OR directly to Google OAuth
      const isValidOAuthRedirect =
        redirectUrl.includes('supabase.co/auth/v1/authorize') ||
        redirectUrl.includes('accounts.google.com/o/oauth2');

      expect(isValidOAuthRedirect).toBe(true);

      // If we hit Supabase, verify it includes provider=google
      if (redirectUrl.includes('supabase.co')) {
        expect(redirectUrl).toContain('provider=google');
      }
    });
  }

  test('callback route — handles missing code without crash or loop', async ({
    page,
  }) => {
    // Hit the callback with no code — should redirect gracefully, not 500 or loop
    const response = await page.goto('/auth/callback', {
      waitUntil: 'networkidle',
      timeout: 15_000,
    });

    // Should have been redirected (not stuck on callback)
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/auth/callback');

    // Should land on signin or app — not a 500 error page
    const is200 = response?.status() === 200 || response?.status() === 304;
    const isRedirect =
      response?.status() === 307 || response?.status() === 302;
    expect(is200 || isRedirect).toBe(true);

    // Page should not show a server error
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
    expect(body).not.toContain('500');
  });

  test('no GIS script loaded on any auth page', async ({ page }) => {
    for (const { path } of authPages) {
      await page.goto(path, { waitUntil: 'networkidle' });

      // Check no GIS script tags
      const gisScriptCount = await page.evaluate(
        () =>
          document.querySelectorAll(
            'script[src*="accounts.google.com/gsi/client"]',
          ).length,
      );
      expect(gisScriptCount).toBe(0);

      // Check no window.google.accounts object (GIS SDK)
      const hasGIS = await page.evaluate(
        () => !!(window as any).google?.accounts?.id,
      );
      expect(hasGIS).toBe(false);
    }
  });

  test('CSP headers do not include GIS domains', async ({ page }) => {
    const response = await page.goto('/signin', { waitUntil: 'networkidle' });
    const csp =
      response?.headers()['content-security-policy'] ||
      response?.headers()['content-security-policy-report-only'] ||
      '';

    // GIS domains should NOT be in CSP since we removed them
    expect(csp).not.toContain('accounts.google.com/gsi');
    // Note: accounts.google.com may still appear in form-action for OAuth redirects — that's OK
    // We specifically check it's not in script-src
    if (csp.includes('script-src')) {
      const scriptSrc = csp.split('script-src')[1]?.split(';')[0] || '';
      expect(scriptSrc).not.toContain('accounts.google.com');
    }
  });
});
