import { expect, test } from '@playwright/test';

import {
  createMagicLinkSession,
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

test.describe('Admin founder smoke', () => {
  test('founder can access core admin pages and APIs', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    test.skip(
      !hasMagicLinkEnv(),
      'Skipping: Supabase env missing for founder auth bootstrap',
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

    await page.goto('/admin/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    for (const route of CORE_ADMIN_ROUTES) {
      const response = await page.goto(route.path, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

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
      const response = await page.request.get(apiPath);
      expect(response.status(), `${apiPath} should return 200`).toBe(200);
    }
  });
});
