import { test, expect, type Page } from '@playwright/test';
import {
  getTestCredentials,
  cleanupTestUser,
  createMagicLinkSession,
  setPlaywrightSession,
} from './helpers/test-auth';

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

let credentials: { email: string; password: string } | null = null;

function hasAuthBootstrapEnv() {
  return Boolean(
    (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

async function resolveCredentials() {
  if (credentials) return credentials;
  if (!hasAuthBootstrapEnv()) {
    throw new Error('Missing auth bootstrap env for app integrity smoke test');
  }

  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    credentials = {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
    return credentials;
  }

  credentials = await getTestCredentials();
  return credentials;
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
  const creds = await resolveCredentials();
  const appBase = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  await page.addInitScript(() => {
    localStorage.setItem('e2e_test_mode', 'true');
  });

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const session = await createMagicLinkSession(creds.email);
    await setPlaywrightSession(page.context(), session, appBase);
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/app/, { timeout: 20_000 });
    return;
  }

  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 20_000 });
}

test.describe('App link integrity', () => {
  test.skip(!hasAuthBootstrapEnv(), 'Skipping: auth bootstrap env not configured');

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test.afterAll(async () => {
    if (!process.env.E2E_TEST_EMAIL) {
      await cleanupTestUser();
    }
  });

  for (const route of CRITICAL_APP_ROUTES) {
    test(`critical route reachable: ${route}`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      const redirects = redirectCount(response);
      const status = response?.status() ?? 0;
      const text = (await page.locator('body').textContent()) || '';

      expect(
        redirects,
        `Route ${route} triggered ${redirects} redirects (expected <= 2)`,
      ).toBeLessThanOrEqual(2);
      expect([200, 201, 204, 302, 303, 307, 308, 401, 403]).toContain(status);
      expect(text).not.toContain('This page could not be found');
      expect(text).not.toContain("FormaOS couldn't load");
      expect(text).not.toContain('Minified React error #310');
    });
  }

  test('admin route denies gracefully for non-admin users', async ({ page }) => {
    const response = await page.goto('/app/admin', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    const status = response?.status() ?? 0;
    const text = (await page.locator('body').textContent()) || '';

    expect([200, 302, 303, 307, 308, 401, 403]).toContain(status);
    expect(text).not.toContain('This page could not be found');
    expect(text).not.toContain('Minified React error #310');
  });
});
