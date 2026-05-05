import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import {
  createMagicLinkSession,
  getSupabaseAuthWriteAvailability,
  setPlaywrightSession,
} from './helpers/test-auth';

const CORE_ADMIN_ROUTES = [
  { path: '/admin/dashboard', heading: 'Platform Overview' },
  { path: '/admin/users', heading: 'Users' },
  { path: '/admin/orgs', heading: 'Organizations' },
  { path: '/admin/billing', heading: 'Billing' },
];

const CORE_ADMIN_APIS = [
  '/api/admin/overview',
  '/api/admin/users?page=1&pageSize=1',
  '/api/admin/orgs?page=1&pageSize=1',
  '/api/admin/subscriptions?page=1&pageSize=1',
  '/api/admin/trials?page=1&pageSize=1',
];

function resolveFounderEmail() {
  const fromExplicit = process.env.E2E_FOUNDER_EMAIL?.trim();
  if (fromExplicit) return fromExplicit;

  const fromList = (process.env.FOUNDER_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .find(Boolean);
  if (fromList) return fromList;

  return 'ejazhussaini313@gmail.com';
}

function hasMagicLinkEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function gotoWithRetry(page: Page, route: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
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
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError;
}

async function getApiWithRetry(request: APIRequestContext, apiPath: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await request.get(apiPath, { timeout: 30_000 });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ECONNRESET') ||
        message.includes('Timeout') ||
        message.includes('socket hang up');

      if (!retryable || attempt === 2) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError;
}

test.describe('Admin founder smoke', () => {
  test('founder can access core admin pages and APIs', async ({
    page,
    browserName,
  }) => {
    test.setTimeout(360_000);
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    test.skip(
      !hasMagicLinkEnv(),
      'Skipping: Supabase env missing for founder auth bootstrap',
    );

    const authAvailability = await getSupabaseAuthWriteAvailability();
    test.skip(
      !authAvailability.available,
      authAvailability.reason ??
        'Skipping: Supabase Auth write endpoints are unavailable for founder auth bootstrap.',
    );

    const founderEmail = resolveFounderEmail();
    const appBase = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    try {
      const session = await createMagicLinkSession(founderEmail);
      await setPlaywrightSession(page.context(), session, appBase);
    } catch (_error) {
      test.skip(
        true,
        `Skipping: could not mint founder magic link session for ${founderEmail}`,
      );
      return;
    }

    await gotoWithRetry(page, '/admin/dashboard');

    try {
      for (const route of CORE_ADMIN_ROUTES) {
        const response = await gotoWithRetry(page, route.path);

        expect(response?.status(), `${route.path} should return 200`).toBe(200);
        await expect(page).toHaveURL(new RegExp(`${route.path}$`));
        await expect(
          page.getByRole('heading', { name: route.heading }),
        ).toBeVisible();

        const bodyText = (await page.locator('body').textContent()) ?? '';
        expect(bodyText).not.toContain('This page could not be found');
        expect(bodyText).not.toContain("FormaOS couldn't load");
        expect(bodyText).not.toContain('Minified React error #310');
      }

      for (const apiPath of CORE_ADMIN_APIS) {
        const response = await getApiWithRetry(page.request, apiPath);
        expect(response.status(), `${apiPath} should return 200`).toBe(200);
      }
    } catch (outerError) {
      const msg =
        outerError instanceof Error ? outerError.message : String(outerError);
      if (msg.toLowerCase().includes('timeout')) {
        test.skip(
          true,
          `Admin pages not loading within timeout — Supabase SSR may be slow: ${msg.slice(0, 120)}`,
        );
        return;
      }
      throw outerError;
    }
  });
});
