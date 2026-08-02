/**
 * C1 — care-operations no-horizontal-scroll guard at iPhone SE viewport
 * (the narrowest production target). See c1-care-ops.spec.ts for the
 * full iPhone 14 audit; Playwright's device profile sets defaultBrowserType
 * which can only be applied at top level, hence the split file.
 */
import fs from 'node:fs';
import type { Session } from '@supabase/supabase-js';
import { devices, expect, test } from '@playwright/test';
import {
  E2E_SESSION_CACHE_PATH,
  setPlaywrightSession,
} from '../helpers/test-auth';

test.use({ ...devices['iPhone SE'] });

function loadCachedSession(): Session | null {
  try {
    return JSON.parse(
      fs.readFileSync(E2E_SESSION_CACHE_PATH, 'utf8'),
    ) as Session;
  } catch {
    return null;
  }
}

const ROUTES = [
  '/app/incidents',
  '/app/incidents/new',
  '/app/care-plans',
  '/app/participants',
  '/app/visits',
  '/app/progress-notes',
];

test.describe('C1 — iPhone SE (narrowest)', () => {
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
      await page.goto(route, { waitUntil: 'domcontentloaded' });
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
