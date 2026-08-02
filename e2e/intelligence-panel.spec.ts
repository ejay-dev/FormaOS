/**
 * Compliance Intelligence Panel Smoke Test
 * Verifies the panel renders without errors for trial orgs
 */

import { test, expect } from '@playwright/test';
import { getCredentials, gotoAppRoute, loginAs } from './helpers/fixtures';

test.describe('Compliance Intelligence Panel', () => {
  test('renders for trial org without console errors', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (err) => {
      errors.push(`Page error: ${err.message}`);
    });

    // Navigate to home
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Filter out non-critical errors
    const criticalErrors = errors.filter((err) => {
      // Ignore known warnings
      if (err.includes('Warning')) return false;
      if (err.includes('404')) return false;
      if (err.includes('Server Action')) return false;
      return true;
    });

    // Verify no critical console errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('intelligence panel is present on dashboard when enabled', async ({
    page,
    context,
  }) => {
    // This test used to run unauthenticated: it landed on /auth/signin, took
    // the `if (!isAuthPage)` branch never, and its single expectation was
    // swallowed by `.catch(() => {})`. It also looked for the string
    // "Compliance Intelligence", which the panel never renders — its heading
    // is "Executive Intelligence Dashboard". Sign in properly and assert both
    // the data source and the rendered panel.
    const creds = await getCredentials();

    // Enable the intelligence flag before any page script runs. In non-
    // production builds enableIntelligence defaults to false
    // (lib/feature-flags.tsx), and the flag manager reads localStorage at
    // module construction.
    await context.addInitScript(() => {
      localStorage.setItem(
        'formaos_feature_flags',
        JSON.stringify({ enableIntelligence: true }),
      );
    });

    await loginAs(page, creds.email, creds.password);

    // The panel renders only when /api/intelligence/summary answers 200 —
    // it silently returns null on any error. Assert the API contract the
    // component depends on first, so a broken panel and a broken API are
    // distinguishable.
    const response = await page.request.get('/api/intelligence/summary');
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(typeof payload?.complianceScore?.current).toBe('number');
    expect(Array.isArray(payload?.complianceScore?.history)).toBe(true);
    expect(typeof payload?.automation?.successRate).toBe('number');
    expect(typeof payload?.auditReadiness?.score).toBe('number');

    // ComplianceIntelligenceSummary lives on the Command Center "Pulse" tab
    // (components/dashboard/command-center.tsx).
    await gotoAppRoute(page, '/app');
    await page.getByRole('button', { name: 'Pulse' }).click();

    await expect(
      page.getByRole('heading', { name: 'Executive Intelligence Dashboard' }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Compliance Score', { exact: true }).first(),
    ).toBeVisible();
  });
});
