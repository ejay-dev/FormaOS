/**
 * C3 — admin / settings no-horizontal-scroll guard at iPhone SE.
 * Sister file to c3-admin.spec.ts (the device profile must be at top
 * level so iPhone SE coverage lives in its own file).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Session } from '@supabase/supabase-js';
import { devices, expect, test } from '@playwright/test';
import { setPlaywrightSession } from '../helpers/test-auth';

test.use({ ...devices['iPhone SE'] });

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

test.describe('C3 — iPhone SE (narrowest)', () => {
  test.beforeEach(async ({ context }) => {
    const session = loadCachedSession();
    if (!session) {
      test.skip(true, 'no cached e2e session — skipping');
      return;
    }
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
    await setPlaywrightSession(context, session, baseUrl);
  });

  for (const route of ROUTES) {
    test(`${route} — no horizontal scroll`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
      });
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
      expect(
        probe.bodyScrollW,
        `body scroll ${probe.bodyScrollW}px > viewport ${probe.viewportW}px`,
      ).toBeLessThanOrEqual(probe.viewportW + 1);
    });
  }
});
