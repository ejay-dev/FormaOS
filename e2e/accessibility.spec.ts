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

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .exclude('[data-nextjs-toast]')
    .exclude('nextjs-portal')
    .analyze();

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
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Accessibility suite runs once on chromium');
  });

  test('public marketing pages have no serious or critical axe violations', async ({
    page,
  }) => {
    for (const route of publicRoutes) {
      await scanRoute(page, route);
    }
  });

  test('authenticated app pages have no serious or critical axe violations', async ({
    page,
  }) => {
    await authenticateWorkspacePage(page);

    for (const route of authenticatedRoutes) {
      await scanRoute(page, route);
    }
  });
});
