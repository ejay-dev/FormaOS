import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { authenticateWorkspacePage } from './helpers/workspace-seed';

const publicRoutes = [
  '/',
  '/pricing',
  '/contact',
  '/changelog',
  '/security',
  '/trust',
];

const authenticatedRoutes = [
  '/app',
  '/app/forms',
  '/app/care-plans',
  '/app/incidents',
  '/app/policies',
  '/app/settings',
];

async function scanRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});

  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .exclude('[data-nextjs-toast]')
    .exclude('nextjs-portal')
    .exclude('[data-radix-portal]')
    .exclude('[aria-hidden="true"]');

  if (route === '/app' || route.startsWith('/app/')) {
    builder.include('aside');
    builder.include('header');
    builder.include('#main-content');
  }

  const results = await builder.analyze();

  const blockingViolations = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );

  expect(
    blockingViolations,
    blockingViolations
      .map((violation) => {
        const nodes = violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(' '))
          .join(', ');
        return `${route}: ${violation.id} (${violation.impact}) on ${violation.nodes.length} node(s): ${nodes}`;
      })
      .join('\n'),
  ).toEqual([]);
}

test.describe('Accessibility coverage', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Accessibility suite runs once on chromium');
  });

  for (const route of publicRoutes) {
    test(`public route ${route} has no serious or critical axe violations`, async ({
      page,
    }) => {
      test.setTimeout(180_000);
      await scanRoute(page, route);
    });
  }

  // Authenticated route axe scans need workspace-seed env (Supabase
  // URL + anon + service-role) to provision the test session. Without
  // it, authenticateWorkspacePage throws E2EAuthBootstrapError. CI
  // runs without secrets sit these specs out — public-route scans
  // above still cover the marketing surface.
  const HAS_WORKSPACE_SEED_ENV = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  for (const route of authenticatedRoutes) {
    test(`authenticated route ${route} has no serious or critical axe violations`, async ({
      page,
    }) => {
      test.skip(
        !HAS_WORKSPACE_SEED_ENV,
        'Supabase workspace-seed env not configured — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY to scan authenticated routes.',
      );
      test.setTimeout(300_000);
      await authenticateWorkspacePage(page);
      await scanRoute(page, route);
    });
  }
});
