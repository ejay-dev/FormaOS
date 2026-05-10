/**
 * C3 — admin / settings route audit at iPhone 14.
 *
 * Asserts: no horizontal page scroll on each route at 390×844, captures
 * iPhone 14 baseline JPEGs into e2e/screenshots/mobile/c3-*. iPhone SE
 * coverage lives in c3-admin-iphone-se.spec.ts.
 *
 * Settings has many sub-pages; this spec covers the parent plus the
 * highest-traffic sub-routes (organization, security, roles,
 * integrations, notifications). The remaining settings sub-routes
 * follow the same pattern and can be added if a regression appears.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Session } from '@supabase/supabase-js';
import { devices, expect, test } from '@playwright/test';
import { setPlaywrightSession } from '../helpers/test-auth';

test.use({ ...devices['iPhone 14'] });

const SESSION_CACHE_PATH = path.join(
  process.cwd(),
  'test-results',
  'e2e-session-cache.json',
);

function loadCachedSession(): Session | null {
  try {
    return JSON.parse(fs.readFileSync(SESSION_CACHE_PATH, 'utf8')) as Session;
  } catch {
    return null;
  }
}

const ROUTES = [
  '/app/team',
  '/app/billing',
  '/app/settings',
  '/app/settings/organization',
  '/app/settings/security',
  '/app/settings/roles',
  '/app/settings/integrations',
  '/app/settings/notifications',
];

test.describe('C3 — iPhone 14 (390×844)', () => {
  test.beforeEach(async ({ context }) => {
    const session = loadCachedSession();
    if (!session) {
      test.skip(true, 'no cached e2e session — skipping authed C3 audit');
      return;
    }
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
    await setPlaywrightSession(context, session, baseUrl);
  });

  for (const route of ROUTES) {
    test(`${route} — no horizontal scroll + screenshot baseline`, async ({
      page,
    }) => {
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
      });
      // Some settings sub-routes may 404 in test seed; skip cleanly.
      if (response && response.status() === 404) {
        test.skip(true, `${route} returned 404 in this workspace`);
        return;
      }
      await page
        .waitForLoadState('networkidle', { timeout: 5000 })
        .catch(() => {});

      const probe = await page.evaluate(() => ({
        viewportW: window.innerWidth,
        bodyScrollW: document.body.scrollWidth,
      }));
      expect
        .soft(
          probe.bodyScrollW,
          `body scroll ${probe.bodyScrollW}px > viewport ${probe.viewportW}px`,
        )
        .toBeLessThanOrEqual(probe.viewportW + 1);

      const slug = route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({
        path: `e2e/screenshots/mobile/c3-${slug}.jpg`,
        type: 'jpeg',
        quality: 60,
        fullPage: true,
      });
    });
  }
});
