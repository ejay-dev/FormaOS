import { test, expect, type Page } from '@playwright/test';
import {
  cleanupTestUser,
  isE2EAuthBootstrapError,
} from './helpers/test-auth';
import { getCredentials, loginAs } from './helpers/fixtures';

const CRITICAL_APP_ROUTES = [
  '/app',
  '/app/dashboard',
  '/app/compliance',
  '/app/policies',
  '/app/tasks',
  '/app/people',
  '/app/participants',
  '/app/visits',
  '/app/progress-notes',
  '/app/incidents',
  '/app/staff-compliance',
  '/app/registers',
  '/app/vault',
  '/app/reports',
  '/app/settings',
];

function hasAuthBootstrapEnv() {
  return Boolean(
    (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function redirectCount(response: Awaited<ReturnType<Page['goto']>>) {
  if (!response) return 0;
  let count = 0;
  let req = response.request();
  let previous = req.redirectedFrom();
  while (previous) {
    count += 1;
    req = previous;
    previous = req.redirectedFrom();
  }
  return count;
}

async function authenticate(page: Page) {
  const creds = await getCredentials();
  await loginAs(page, creds.email, creds.password);
}

async function gotoWithRetry(page: Page, route: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await page.goto(route, {
        waitUntil: 'commit',
        timeout: 30_000,
      });
      await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), {
        timeout: 15_000,
      });
      await page.locator('body').waitFor({ timeout: 15_000 });
      return response;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ERR_ABORTED') ||
        message.includes('Timeout') ||
        message.includes('ECONNRESET') ||
        message.includes('net::ERR_CONNECTION_RESET');

      if (!retryable || attempt === 2) {
        throw error;
      }

      await page.goto('about:blank', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }

  throw lastError;
}

test.describe('App link integrity', () => {
  test.skip(!hasAuthBootstrapEnv(), 'Skipping: auth bootstrap env not configured');

  test.beforeEach(async ({ page }) => {
    try {
      await authenticate(page);
    } catch (error) {
      test.skip(
        isE2EAuthBootstrapError(error),
        error instanceof Error ? error.message : 'E2E auth bootstrap unavailable',
      );
      throw error;
    }
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  for (const route of CRITICAL_APP_ROUTES) {
    test(`critical route reachable: ${route}`, async ({ page }) => {
      test.setTimeout(180_000);

      const response = await gotoWithRetry(page, route);

      const redirects = redirectCount(response);
      const status = response?.status() ?? 0;
      const text = (await page.locator('body').textContent()) || '';

      expect(
        redirects,
        `Route ${route} triggered ${redirects} redirects (expected <= 2)`,
      ).toBeLessThanOrEqual(2);
      // 2026-08-02: 401 and 403 used to count as success. `beforeEach` logs
      // in via `loginAs`, so an unauthorized status on a critical /app route
      // IS the auth/entitlement regression this gate exists to catch — a
      // broken session or a bad RLS change would have kept the suite green.
      expect(
        [200, 201, 204, 302, 303, 307, 308],
        `Route ${route} returned ${status} for an authenticated session`,
      ).toContain(status);
      // A 200 that renders the sign-in form is the same regression wearing a
      // different status code.
      expect(text).not.toContain('Access FormaOS');
      expect(text).not.toContain('This page could not be found');
      expect(text).not.toContain("FormaOS couldn't load");
      expect(text).not.toContain('Minified React error #310');
    });
  }

  test('admin route denies gracefully for non-admin users', async ({ page }) => {
    test.setTimeout(180_000);

    const response = await gotoWithRetry(page, '/app/admin');

    const status = response?.status() ?? 0;
    const text = (await page.locator('body').textContent()) || '';

    expect([200, 302, 303, 307, 308, 401, 403]).toContain(status);
    expect(text).not.toContain('This page could not be found');
    expect(text).not.toContain('Minified React error #310');
  });
});
