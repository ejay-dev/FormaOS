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

  for (const route of authenticatedRoutes) {
    test(`authenticated route ${route} has no serious or critical axe violations`, async ({
      page,
    }) => {
      test.setTimeout(300_000);
      await authenticateWorkspacePage(page);
      await scanRoute(page, route);
    });
  }
});
