import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicRoutes = [
  '/',
  '/product',
  '/pricing',
  '/security',
  '/contact',
  '/auth/signin',
  '/auth/signup',
];

test.describe('Accessibility smoke (WCAG 2.2 AA)', () => {
  for (const route of publicRoutes) {
    test(`should have no serious/critical accessibility violations on ${route}`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const blockingViolations = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );

      expect(
        blockingViolations,
        blockingViolations
          .map(
            (v) =>
              `${v.id} (${v.impact}) on ${route} -> ${v.nodes.length} nodes`,
          )
          .join('\n'),
      ).toEqual([]);
    });
  }
});
